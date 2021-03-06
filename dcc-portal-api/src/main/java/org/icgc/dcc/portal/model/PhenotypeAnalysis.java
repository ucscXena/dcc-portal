/*
 * Copyright (c) 2015 The Ontario Institute for Cancer Research. All rights reserved.                             
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
package org.icgc.dcc.portal.model;

import static com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL;

import java.util.Date;
import java.util.List;
import java.util.UUID;

import lombok.Data;
import lombok.Getter;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;

/**
 * Represents the result set of a phenotype analysis.
 */
@Data
@ApiModel(value = "PhenotypeAnalysis")
@JsonInclude(NON_NULL)
public class PhenotypeAnalysis implements Identifiable<UUID> {

  @NonNull
  private final UUID id;
  @NonNull
  private final List<UUID> entitySetIds;

  private final int inputCount;

  private List<PhenotypeResult> results;

  private int version = 1;
  private State state = State.FINISHED;
  private final long timestamp = new Date().getTime();

  private final static class JsonPropertyName {

    final static String ID = "id";
    final static String ENTITY_SET_IDS = "entitySetIds";
    final static String INPUT_COUNT = "inputCount";
    final static String VERSION = "version";

  }

  @JsonCreator
  public PhenotypeAnalysis(
      @JsonProperty(JsonPropertyName.ID) final UUID id,
      @JsonProperty(JsonPropertyName.ENTITY_SET_IDS) final List<UUID> entitySetIds,
      @JsonProperty(JsonPropertyName.INPUT_COUNT) final int inputCount,
      @JsonProperty(JsonPropertyName.VERSION) final int dataVersion) {
    this.id = id;
    this.entitySetIds = entitySetIds;
    this.inputCount = inputCount;
    this.version = dataVersion;
  }

  @RequiredArgsConstructor
  @Getter
  public enum State {

    FINISHED("finished"),
    ERROR("error");

    @NonNull
    private final String name;

  }

}
