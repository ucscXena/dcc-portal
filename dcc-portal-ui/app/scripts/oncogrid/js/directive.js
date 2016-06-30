/*
 * Copyright 2016(c) The Ontario Institute for Cancer Research. All rights reserved.
 *
 * This program and the accompanying materials are made available under the terms of the GNU Public
 * License v3.0. You should have received a copy of the GNU General Public License along with this
 * program. If not, see <http://www.gnu.org/licenses/>.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 * FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY
 * WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

(function () {
  'use strict';

  angular.module('icgc.oncogrid', ['icgc.oncogrid.directives', 'icgc.oncogrid.services']);

})();


(function ($, OncoGrid) {
  'use strict';

  var module = angular.module('icgc.oncogrid.directives', []);

  module.directive('oncogridAnalysis', function (Donors, Genes, Occurrences, Consequence, 
  $q, $filter, OncogridService, $timeout) {
    return {
      restrict: 'E',
      scope: {
        item: '='
      },
      templateUrl: '/scripts/oncogrid/views/oncogrid-analysis.html',
      link: function ($scope) {
        var donorSearch = '/search?filters=';
        var geneSearch = '/search/g?filters=';
        var obsSearch = '/search/m/o?filters=';

        function createLinks() {
          $scope.geneSet = $scope.item.geneSet;
          $scope.donorSet = $scope.item.donorSet;

          var donorFilter = OncogridService.donorFilter($scope.donorSet);
          $scope.donorLink  = donorSearch + JSON.stringify(donorFilter);

          var geneFilter = OncogridService.geneFilter($scope.geneSet);
          $scope.geneLink = geneSearch + JSON.stringify(geneFilter);

          var obsFilter = OncogridService.observationFilter($scope.donorSet, $scope.geneSet);
          $scope.obsLink = obsSearch + JSON.stringify(obsFilter);
          $scope.gvLink = '/browser/m?filters=' + JSON.stringify(obsFilter);
        }

        $scope.materializeSets = function() {
          var donorPromise = OncogridService.getDonors($scope.donorSet)
          .then(function (data) {
            $scope.donors = data;
          });

          var genePromise = OncogridService.getGenes($scope.geneSet)
          .then(function (data) {
            $scope.genes = data;
          });

          var geneCuratedSetPromise = OncogridService.getCuratedSet($scope.geneSet)
          .then(function (data) {
            $scope.curatedList = _.map(data, function(g) {
              return g.id;
            });
          });
        
          var occurrencePromise = OncogridService.getOccurences($scope.donorSet, $scope.geneSet)
          .then(function (data) {
            $scope.obsCount = data.length;
            $scope.occurrences = data;
          });

          return $q.all([donorPromise, genePromise, geneCuratedSetPromise, occurrencePromise]);
        };

        $scope.initOnco =  function() {

          var donors = OncogridService.mapDonors($scope.donors);
          var genes = OncogridService.mapGenes($scope.genes, $scope.curatedList);

          var donorIds = _.map($scope.donors, function (g) { return g.id; });
          var geneIds = _.map($scope.genes, function (d) { return d.id; });

          var observations = OncogridService.mapOccurences($scope.occurrences, donorIds, geneIds);

          var donorTracks = [
            { 'name': 'PCAWG', 'fieldName': 'pcawg', 'type': 'bool' },
            { 'name': 'Age at Diagnosis', 'fieldName': 'age', 'type': 'int' },
            { 'name': 'Vital Status', 'fieldName': 'vitalStatus', 'type': 'vital' },
            { 'name': 'Sex', 'fieldName': 'sex', 'type': 'sex' },
            { 'name': 'CNSM Exists', 'fieldName': 'cnsmExists', 'type': 'bool' },
            { 'name': 'STSM Exists', 'fieldName': 'stsmExists', 'type': 'bool' },
            { 'name': 'SGV Exists', 'fieldName': 'sgvExists', 'type': 'bool' },
            { 'name': 'METH-A Exists', 'fieldName': 'methArrayExists', 'type': 'bool'}
          ];

          var donorOpacity = function (d) {
            if (d.type === 'int') {
              return d.value / 100;
            } else if (d.type === 'vital') {
              return 1;
            } else if (d.type === 'sex') {
              return 1;
            } else if (d.type === 'bool') {
              return d.value ? 1 : 0;
            } else {
              return 0;
            }
          };

          var geneTracks = [
            { 'name': '# Donors affected ', 'fieldName': 'totalDonors', 'type': 'int' },
            { 'name': 'Curated Gene Census ', 'fieldName': 'cgc', 'type': 'bool' }
          ];

          var maxDonorsAffected = _.max(genes, function (g) { return g.totalDonors; }).totalDonors;

          var geneOpacity = function (g) {
            if (g.type === 'int') {
              return g.value / maxDonorsAffected;
            } else if (g.type === 'bool') {
              return g.value ? 1 : 0;
            } else {
              return 1;
            }
          };

          var gridClick = function (o) {
            window.location = /mutations/ + o.id +
              '?filters={"mutation":{"functionalImpact":{"is":["High"]}}}';
          };

          var donorClick = function(d) {
            window.location = /donors/ + d.id +
              '?filters={"mutation":{"functionalImpact":{"is":["High"]}}}';
          };

          var geneClick = function(g) {
            window.location = /genes/ + g.id +
              '?filters={"mutation":{"functionalImpact":{"is":["High"]}}}';
          };

          var params = {
            donors: donors,
            genes: genes,
            observations: observations,
            element: '#oncogrid-div',
            height: 400, 
            width: 800,
            gridClick: gridClick,
            heatMap: false,
            minCellHeight: 7,
            trackHeight: 10,
            donorTracks: donorTracks,
            donorOpacityFunc: donorOpacity,
            donorClick: donorClick,
            geneTracks: geneTracks,
            geneOpacityFunc: geneOpacity,
            geneClick: geneClick,
            margin: { top: 30, right: 50, bottom: 100, left: 80 }
          };

          $scope.grid = new OncoGrid(params);
          $scope.grid.render();
        };

        $scope.$watch('item', function (n) {
          if (n) {
            if (typeof $scope.grid !== 'undefined' && $scope.grid !== null) {
              $scope.grid.destroy();
            }
            $('#oncogrid-spinner').toggle(true);
            createLinks();
            $scope.materializeSets().then(function () {
              $('#oncogrid-spinner').toggle(false);
              $scope.initOnco();
              $timeout(function() {
                $scope.removeCleanDonors();
                $scope.removeCleanGenes();
              }, 0);
            });
          }
        });

        $scope.removeCleanDonors = function () {
          var criteria = function (d) {
            return d.score === 0;
          };

          $scope.grid.removeDonors(criteria);
        };

        $scope.removeCleanGenes = function () {
          var criteria = function (d) {
            return d.score === 0;
          };

          $scope.grid.removeGenes(criteria);
        };

        $scope.clusterData = function () {
          $scope.grid.cluster();
        };

        $scope.sortByAge = function () {
          $scope.grid.sortDonors(function (a, b) {
            return a.age - b.age;
          });
        };
        
        $scope.sortBySex = function () {
          $scope.grid.sortDonors(function (a, b) {
            if (a.sex === b.sex) {
              return 0; 
            } else if (a.sex === 'male') {
              return 1;
            } else {
              return -1;
            }
          });
        };


        function fullScreenHandler() {
          if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement) {
            $scope.grid.resize(800, 400);
          } else {
            $scope.resizeFull();
          }
          $('#og-fullscreen-button').toggleClass('icon-resize-full');
          $('#og-fullscreen-button').toggleClass('icon-resize-small');
        }

        if (document.addEventListener){
          document.addEventListener('webkitfullscreenchange', fullScreenHandler);
          document.addEventListener('mozfullscreenchange', fullScreenHandler);
          document.addEventListener('fullscreenchange', fullScreenHandler);
        }


        function exitFullScreen() {
          if (document.exitFullscreen) {
              document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
              document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
              document.webkitExitFullscreen();
            }
        }

        $scope.requestFullScreen = function() {

          if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement) {
            var element = document.getElementById('oncogrid-container');
            if (element.requestFullscreen) {
              element.requestFullscreen();
            } else if (element.mozRequestFullScreen) {
              element.mozRequestFullScreen();
            } else if (element.webkitRequestFullScreen) {
              element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
            }
          } else {
            exitFullScreen();
          }

        };

        $scope.resizeFull = function() {
          console.log($(window).width());
          console.log($(window).height());
          $scope.grid.resize(screen.width - 400, screen.height - 300);
        };

        $scope.heatMap = function () {
          $('#heat-button').toggleClass('active');
          $scope.grid.toggleHeatmap();
        };

        $scope.gridLines = function () {
          $('#grid-button').toggleClass('active');
          $scope.grid.toggleGridLines();
        };

        $scope.crosshair = function () {
          $('#crosshair-button').toggleClass('active');
          $('#oncogrid-div').toggleClass('og-pointer-mode');
          $('#oncogrid-div').toggleClass('og-crosshair-mode');
          $scope.grid.toggleCrosshair();
        };

        $scope.printGrid = function () {
          var gridDiv = document.getElementById('oncogrid-div').outerHTML;
          document.body.innerHTML = gridDiv;
          window.print();
        };

        $scope.$on('$destroy', function () {
          if (typeof $scope.grid !== 'undefined') {
            $scope.grid.destroy();
          }
          document.removeEventListener('webkitfullscreenchange', fullScreenHandler);
          document.removeEventListener('mozfullscreenchange', fullScreenHandler);
          document.removeEventListener('fullscreenchange', fullScreenHandler);
        });

      }
    };
  });

})(jQuery, OncoGrid);