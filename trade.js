// JavaScript File
	var app = angular.module('myApp', []);
	var currencyPair = 'EUR_USD';
	app.controller('myCtrl', function($scope) {

		$scope.createAccount =	function() {
			    OANDA.account.register('USD', function(response) {
			        $scope.myaccount = response;
			    	$scope.$apply();
			    });
		}

		$scope.createAccount();

		$scope.openMarketOrder = function(accountId) {
				OANDA.order.open(accountId, currencyPair, 100, 'sell', 'market', {'trailingStop' : 100}, function(response) {
					$scope.order = response;
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

		$scope.getRate = function getRates() {
        		OANDA.rate.quote([currencyPair], function(response) {
        			$scope.rates = response;
        			$scope.$apply();
        		}
        	);
    	}

    	$scope.getHistoricalRate = function getHistory() {
        		OANDA.rate.history(currencyPair, {'granularity' : "S5", 'count' : "2"}, function(response) {
        			$scope.historicalRates = response;
        			$scope.$apply();
        		}
        	);
    	}

    	$scope.getTransactionList = function transactionList(accountId) {
        		OANDA.transaction.list(accountId, {'ids' : '2347', 'instrument' : currencyPair}, function(response) {
        			$scope.transList = response;
        			$scope.$apply();
        		}
        	);
    	}

    	$scope.getInstruments = function getInstruments() {
        		OANDA.rate.instruments(['pip'], [''],  function(response) {
        			$scope.instruments = response.instruments;
        			$scope.$apply();
        		}
        	);
    	}

    	$scope.getInstruments();
    });
