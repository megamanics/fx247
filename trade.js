// JavaScript File
	var app = angular.module('myApp', []);
	var currencyPair = 'EUR_USD';
	app.controller('myCtrl', function($scope) {

		$scope.createAccount =	function() {
			    OANDA.account.register('USD', function(accountoanda) {
			        $scope.myaccount = accountoanda;
			    	$scope.$apply();
			    });
		}

		$scope.openMarketOrder = function(accountId) {
				OANDA.order.open(accountId, currencyPair, 100, 'sell', 'market', {'trailingStop' : 100}, function(openMarketOrderResponse) {
					$scope.order = openMarketOrderResponse;
					$scope.listTrade(accountId);
					$scope.$apply();
				}
			)
		}

		$scope.listTrade = function (accountId) {
        		OANDA.trade.list(accountId, {instrument : currencyPair}, function(response) {
        			$scope.trades = response;
        			$scope.$apply();
        		}
        	);
		}
    });
