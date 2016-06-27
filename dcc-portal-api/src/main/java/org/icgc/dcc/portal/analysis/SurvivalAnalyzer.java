/*
 * Copyright (c) 2016 The Ontario Institute for Cancer Research. All rights reserved.                             
 *                                                                                                               
 * This program and the accompanying materials are made available under the terms of the GNU Public License v3.0.
 * You should have received a copy of the GNU General Public License along with                                  
 * this program. If not, see <http://www.gnu.org/licenses/>.                                                     
 *                                                                                                               
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY                           
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES                          
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT                           
 * SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,                                
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED                          
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;                               
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER                              
 * IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN                         
 * ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
package org.icgc.dcc.portal.analysis;

import static org.icgc.dcc.portal.model.Query.builder;

import java.util.ArrayList;
import java.util.List;

import org.elasticsearch.search.SearchHit;
import org.icgc.dcc.portal.model.SurvivalAnalysis;
import org.icgc.dcc.portal.model.SurvivalAnalysis.Result;
import org.icgc.dcc.portal.model.param.FiltersParam;
import org.icgc.dcc.portal.repository.DonorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import lombok.Data;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.Value;
import lombok.val;

@Service
@RequiredArgsConstructor(onConstructor = @__(@Autowired))
public class SurvivalAnalyzer {

  /**
   * Constants
   */
  private final static String DONOR_FILTER =
      "{'donor':{'id':{'is':['ES:%s']},'vitalStatus':{'is':['alive','deceased']}}}";

  /**
   * Dependencies.
   */
  @NonNull
  private final DonorRepository donorRepository;

  public SurvivalAnalysis analyze(SurvivalAnalysis analysis) {

    analysis.setResults(new ArrayList<Result>());
    for (val id : analysis.getEntitySetIds()) {
      val filter = new FiltersParam(String.format(DONOR_FILTER, id));
      val query = builder()
          .filters(filter.get())
          .from(0)
          .size(20000)
          .sort("survivalTime")
          .order("asc")
          .build();

      val result = donorRepository.findAllCentric(query);
      val intervals = compute(result.getHits().getHits());

      analysis.getResults().add(analysis.new Result(id, intervals));
    }

    return analysis;
  }

  private static List<Interval> compute(SearchHit[] donors) {
    int[] time = new int[donors.length];
    boolean[] censured = new boolean[donors.length];

    for (int i = 0; i < donors.length; i++) {
      val donor = donors[i];
      time[i] = (int) donor.field("donor_survival_time").getValue();
      censured[i] = ((String) donor.field("donor_vital_status").getValue()).equalsIgnoreCase("alive");
    }

    val intervals = new ArrayList<Interval>();
    int startTime = 0;
    int endTime = 0;

    for (int i = 0; i < time.length; i++) {
      endTime = time[i];
      if (censured[i] == false && endTime > startTime) {
        intervals.add(new Interval(startTime, endTime));
        startTime = endTime;
      }
    }
    if (endTime > startTime) {
      intervals.add(new Interval(startTime, endTime));
    }

    // init variables. Initially everyone is at risk, and the cumulative survival is 1
    float atRisk = time.length;
    float cumulativeSurvival = 1;
    val intervalIter = intervals.iterator();

    // This implementation later mutates this reference.
    Interval currentInterval = intervalIter.next();
    currentInterval.setCumulativeSurvival(cumulativeSurvival);

    for (int i = 0; i < time.length; i++) {

      long t = time[i];

      // If we have moved past the current interval compute the cumulative survival and adjust the # at risk
      // for the start of the next interval.
      if (t > currentInterval.getEnd()) {
        atRisk -= currentInterval.getCensured();
        float survivors = atRisk - currentInterval.getDied();
        float tmp = survivors / atRisk;
        cumulativeSurvival *= tmp;

        // Skip to the next interval
        atRisk -= currentInterval.getDied();
        while (intervalIter.hasNext() && t > currentInterval.getEnd()) {
          currentInterval = intervalIter.next();
          currentInterval.setCumulativeSurvival(cumulativeSurvival);
        }
      }

      val donor = new DonorValue(
          (String) donors[i].field("_donor_id").getValue(),
          (String) donors[i].field("donor_vital_status").getValue(),
          time[i]);
      if (censured[i]) {
        currentInterval.addDonor(donor);
      } else {
        currentInterval.addDonor(donor);
        currentInterval.incDied();
      }
    }
    currentInterval.setCumulativeSurvival(cumulativeSurvival);

    return intervals;
  }

  @Data
  public static class Interval {

    private final int start;
    private final int end;
    private int died;
    private List<DonorValue> donors = new ArrayList<DonorValue>();
    private float cumulativeSurvival;

    void incDied() {
      died++;
    }

    void addDonor(DonorValue donor) {
      donors.add(donor);
    }

    public int getCensured() {
      int sum = 0;
      for (val donor : donors) {
        sum += donor.getStatus().equalsIgnoreCase("alive") ? 1 : 0;
      }
      return sum;
    }

  }

  @Value
  public static class DonorValue {

    String id;
    String status;
    int survivalTime;

  }

}