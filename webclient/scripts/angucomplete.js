/**
 * Angucomplete
 * Autocomplete directive for AngularJS
 * By Daryl Rowland
 */

angular.module('angucomplete', [] )
    .directive('angucomplete', function ($parse, $http, $sce, $timeout, $rootScope)
    {
    return {
        restrict: 'EA',
        scope: {
            "id": "@id",
            "placeholder": "@placeholder",
            "selectedObject": "=selectedobject",
            "url": "@url",
            "dataField": "@datafield",
            "titleField": "@titlefield",
            "descriptionField": "@descriptionfield",
            "imageField": "@imagefield",
            "imageUri": "@imageuri",
            "inputClass": "@inputclass",
            "userPause": "@pause",
            "localData": "=localdata",
            "searchFields": "@searchfields",
            "minLengthUser": "@minlength",
            "matchClass": "@matchclass",
            "callBack": "@callback",
            "clearSelection": "@clearselection"
        },

        template: '<div class="angucomplete-holder"><input ng-focus="focus===true" id="{{id}}_value" ng-model="searchStr" type="text" placeholder="{{placeholder}}" style="overflow-y: auto" class="{{inputClass}}" ng-change="searchTimerComplete(searchStr)" ng-blur="hideResults()" autocomplete="off"/><div id="{{id}}_dropdown" class="angucomplete-dropdown" ng-if="showDropdown"><div class="angucomplete-searching" ng-show="searching">Searching...</div><div class="angucomplete-searching" ng-show="!searching && (!results || results.length == 0)">No results found</div><div class="angucomplete-row" ng-repeat="result in results" ng-mousedown="selectResult(result);" ng-mouseover="hoverRow()" ng-class="{\'angucomplete-selected-row\': $index == currentIndex}"><div ng-if="imageField" class="angucomplete-image-holder"><img ng-if="result.image && result.image != \'\'" ng-src="{{result.image}}" class="angucomplete-image"/><div ng-if="!result.image && result.image != \'\'" class="angucomplete-image-default"></div></div><div class="angucomplete-title" ng-if="matchClass" ng-bind-html="result.title"></div><div class="angucomplete-title" ng-if="!matchClass">{{ result.title }}</div><div ng-if="result.description && result.description != \'\'" class="angucomplete-description">{{result.description}}</div></div></div></div>',

        link: function ($scope, elem)
        {
            $scope.lastSearchTerm = null;
            $scope.currentIndex = null;
            $scope.justChanged = false;
            $scope.searchTimer = null;
            $scope.hideTimer = null;
            $scope.searching = false;
            $scope.pause = 500;
            $scope.minLength = 3;
            $scope.searchStr = null;

            var inputField = elem.find('input');
            if (inputField)
            {
                $timeout(function ()
                {
                    inputField[0].focus();
                });
            }

            if ($scope.minLengthUser && $scope.minLengthUser !== "")
            {
                $scope.minLength = $scope.minLengthUser;
            }

            if ($scope.userPause)
            {
                $scope.pause = $scope.userPause;
            }

            isNewSearchNeeded = function(newTerm, oldTerm)
            {
                return newTerm.length >= $scope.minLength && newTerm !== oldTerm;
            }

            $scope.processResults = function (responseData, str)
            {
                if (responseData && responseData.length > 0)
                {
                    $scope.results = [];

                    var titleFields = [];
                    if ($scope.titleField && $scope.titleField != "")
                    {
                        titleFields = $scope.titleField.split(",");
                    }

                    for (var i = 0; i < responseData.length; i++)
                    {
                        // Get title variables
                        var titleCode = [];

                        for (var t = 0; t < titleFields.length; t++)
                        {
                            titleCode.push(responseData[i][titleFields[t]]);
                        }

                        var description = "";
                        if ($scope.descriptionField)
                        {
                            description = responseData[i][$scope.descriptionField];
                        }

                        var imageUri = "";
                        if ($scope.imageUri)
                        {
                            imageUri = $scope.imageUri;
                        }

                        var image = "";
                        if ($scope.imageField)
                        {
                            image = imageUri + responseData[i][$scope.imageField];
                        }

                        var text = titleCode.join(' ');
                        if ($scope.matchClass)
                        {
                            var re = new RegExp(str, 'i');
                            var strPart = text.match(re)[0];
                            str = strPart;
                            text = $sce.trustAsHtml(text.replace(re, '<span class="'+ $scope.matchClass +'">'+ strPart +'</span>'));
                        }

                        var resultRow =
                        {
                            title: text,
                            description: description,
                            isOriginalObject : true,
                            image: image,
                            originalObject: responseData[i]
                        }

                        $scope.results[$scope.results.length] = resultRow;
                    }
                }
                else
                {
                    if(str && str.length > 0)
                    {
                        var resultRow =
                        {
                            title: str.replace(',',''),
                            isOriginalObject : false,
                            description: '',
                            image: '',
                            originalObject: {}
                        }

                        if ($scope.clearSelection === 'true')
                        {
                            $scope.selectResult(resultRow);
                        }
                        else{
                            $scope.results[$scope.results.length] = resultRow;
                        }
                    }
                }
            }

            $scope.searchTimerComplete = function(search)
            {
                // Begin the search

                var searchFields = $scope.searchFields.split(",");
                var matches = [];

                if (search && search.length >= $scope.minLength)
                {
                    if ($scope.localData)
                    {

                        if ($scope.clearSelection === 'true')
                        {
                            //console.log('Pasted number with check : ' + search);
                            //perform destination pre-search
                            $rootScope.getDestinationCode(search.replace(',',''));

                            for (var i = 0; i < $scope.localData.length; i++)
                            {
                                var match = false;

                                for (var s = 0; s < searchFields.length; s++)
                                {
                                    match = match || (typeof $scope.localData[i][searchFields[s]] === 'string' && typeof search === 'string' && $scope.localData[i][searchFields[s]].toLowerCase().indexOf(search.toLowerCase()) >= 0);
                                }

                                if (match)
                                {
                                    matches[matches.length] = $scope.localData[i];
                                }
                            }


                            $scope.searching = false;
                            $scope.processResults(matches, search);
                        }

                        else
                        {
                            var searchSplit = search.trim().split(",");
                            var str = searchSplit[searchSplit.length-1].trim();
                            $scope.preSearch = str;

                            for (var i = 0; i < $scope.localData.length; i++)
                            {
                                var match = false;

                                for (var s = 0; s < searchFields.length; s++)
                                {
                                    match = match || (typeof $scope.localData[i][searchFields[s]] === 'string' && typeof str === 'string' && $scope.localData[i][searchFields[s]].toLowerCase().indexOf(str.toLowerCase()) >= 0);
                                }

                                if (match)
                                {
                                    matches[matches.length] = $scope.localData[i];
                                }
                            }

                            $scope.searching = false;
                            $scope.processResults(matches, str);
                        }

                    } else {
                        $http.get($scope.url + search, {}).
                        success(function(responseData, status, headers, config)
                        {
                            $scope.searching = false;
                            $scope.processResults((($scope.dataField) ? responseData[$scope.dataField] : responseData ), search);
                        }).
                        error(function(data, status, headers, config) {
                            console.log("error");
                        });
                    }
                }
                else{
                    if ($scope.localData && search && search.length > 0)
                    {
                        if ($scope.clearSelection === 'true')
                        {
                            console.log('Pasted number : ' + search);
                            //perform destination pre-search
                            $rootScope.getDestinationCode(search);

                            for (var i = 0; i < $scope.localData.length; i++)
                            {
                                var match = false;

                                for (var s = 0; s < searchFields.length; s++)
                                {
                                    match = match || (typeof $scope.localData[i][searchFields[s]] === 'string' && typeof search === 'string' && $scope.localData[i][searchFields[s]].toLowerCase().indexOf(search.toLowerCase()) >= 0);
                                }

                                if (match)
                                {
                                    matches[matches.length] = $scope.localData[i];
                                }
                            }


                            $scope.searching = false;
                            $scope.processResults(matches, search);
                        }

                        else
                        {
                            searchSplit = search.trim().split(",");
                            str = searchSplit[searchSplit.length-1].trim();
                            $scope.preSearch = str;

                            for (var i = 0; i < $scope.localData.length; i++)
                            {
                                var match = false;

                                for (var s = 0; s < searchFields.length; s++)
                                {
                                    match = match || (typeof $scope.localData[i][searchFields[s]] === 'string' && typeof str === 'string' && $scope.localData[i][searchFields[s]].toLowerCase().indexOf(str.toLowerCase()) >= 0);
                                }

                                if (match)
                                {
                                    matches[matches.length] = $scope.localData[i];
                                }
                            }

                            $scope.searching = false;
                            $scope.processResults(matches, str);
                        }

                    }
                }
            };

            $scope.hideResults = function()
            {
                $scope.hideTimer = $timeout(function()
                {
                    $scope.showDropdown = false;
                }, $scope.pause);

            };

            $scope.resetHideResults = function() {
                if($scope.hideTimer) {
                    $timeout.cancel($scope.hideTimer);
                };
            };

            $scope.hoverRow = function(index) {
                $scope.currentIndex = index;
            }

            $scope.keyPressed = function(event)
            {
                if (!(event.which == 38 || event.which == 40 || event.which == 13))
                {
                    if (!$scope.searchStr || $scope.searchStr == "")
                    {
                        $scope.showDropdown = false;
                        $scope.lastSearchTerm = null
                    } else if (isNewSearchNeeded($scope.searchStr, $scope.lastSearchTerm))
                    {
                        $scope.lastSearchTerm = $scope.searchStr
                        $scope.showDropdown = true;
                        $scope.currentIndex = -1;
                        $scope.results = [];

                        if ($scope.searchTimer) {
                            $timeout.cancel($scope.searchTimer);
                        }

                        $scope.searching = true;

                        $scope.searchTimer = $timeout(function()
                        {
                            $scope.searchTimerComplete($scope.searchStr);
                        }, $scope.pause);


                    }
                }
                else
                {
                    event.preventDefault();
                    if ($scope.searchStr.trim() && $scope.searchStr.trim().length > 0)
                    {
                        $scope.searchTimerComplete($scope.searchStr.trim())
                    }

                }
            }
            
            $scope.selectResult = function (result)
            {
                if ($scope.matchClass)
                {
                    result.title = result.title.toString().replace(/(<([^>]+)>)/ig, '');
                }

                if ($scope.clearSelection === 'true')
                {
                    $rootScope.anguCompleteResults = [];
                    $scope.searchStr = $scope.lastSearchTerm = result.title;
                    $scope.selectedObject = result;
                    $scope.showDropdown = false;
                    $rootScope.anguCompleteResults = [result];
                    $scope.results = [];

                }
                else
                {
                    if($rootScope.anguCompleteResults == null || $rootScope.anguCompleteResults === undefined || $rootScope.anguCompleteResults.length < 1)
                    {
                        $rootScope.anguCompleteResults = [];
                        $scope.searchStr  =  result.title;
                        $scope.lastSearchTerm = result.title;
                        $rootScope.anguCompleteResults.push(result)
                    }
                    else
                    {

                        if($scope.searchStr.length < 1)
                        {
                            $scope.searchStr = $scope.lastSearchTerm = result.title;
                        }
                        else
                        {
                            var machList = $rootScope.anguCompleteResults.filter(function(t, i)
                            {
                                return t.title === result.title;
                            });

                            if(machList.length > 0)
                            {
                                var searchTitle = '';
                                angular.forEach($rootScope.anguCompleteResults, function(x, y)
                                {
                                    if(searchTitle.length < 1)
                                    {
                                        searchTitle = x.title;
                                    }
                                    else{
                                        searchTitle += ',' + x.title;
                                    }
                                });
                                $scope.searchStr  =  searchTitle;
                                $scope.lastSearchTerm = searchTitle;
                                return;
                            }

                            //todo: verify that this is not newly typed and selected item

                            result.isOriginalContact = false;
                            $rootScope.anguCompleteResults.push(result)
                            var searchTitle = '';
                            angular.forEach($rootScope.anguCompleteResults, function(x, y)
                            {
                                if(searchTitle.length < 1)
                                {
                                    searchTitle = x.title;
                                }
                                else{
                                    searchTitle += ',' + x.title;
                                }
                            });
                            $scope.searchStr  =  searchTitle;
                            $scope.lastSearchTerm = searchTitle;
                        }
                    }
                }


                var callBack = $rootScope[$scope.callBack];
                
                if (callBack)
                {
                    callBack($rootScope.anguCompleteResults);
                }

                $scope.showDropdown = false;
                $scope.results = [];

                if (inputField)
                {
                    $timeout(function ()
                    {
                        inputField[0].focus();
                    });
                }
            }
            
            inputField.on('keyup', $scope.keyPressed);

            elem.on("keyup", function (event) {
                if(event.which === 40) {
                    if ($scope.results && ($scope.currentIndex + 1) < $scope.results.length) {
                        $scope.currentIndex ++;
                        $scope.$apply();
                        event.preventDefault;
                        event.stopPropagation();
                    }

                    $scope.$apply();
                } else if(event.which == 38)
                {
                    if ($scope.currentIndex >= 1)
                    {
                        $scope.currentIndex --;
                        $scope.$apply();
                        event.preventDefault;
                        event.stopPropagation();
                    }

                } else if (event.which == 13) {
                    if ($scope.results && $scope.currentIndex >= 0 && $scope.currentIndex < $scope.results.length) {
                        $scope.selectResult($scope.results[$scope.currentIndex]);
                        $scope.$apply();
                        event.preventDefault;
                        event.stopPropagation();
                    } else {
                        $scope.results = [];
                        $scope.$apply();
                        event.preventDefault;
                        event.stopPropagation();
                    }

                } else if (event.which == 27)
                {
                    $scope.results = [];
                    $scope.showDropdown = false;
                    $scope.$apply();
                } else if (event.which == 8)
                {
                    $scope.selectedObject = null;
                    $scope.$apply();
                }
            });

        }
    };
});

