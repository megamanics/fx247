// JavaScript File

var app = angular.module('myApp', []);
var currencyPair = 'USD_ZAR';
var acctId = 0;
var operations = ["buy","sell"];


$(document).ready(function() {
	$("#selectInst").find("[value='string:USD_ZAR']").attr("selected", "selected");

});


app.controller('myCtrl', function($scope) {


	$scope.createAccount = function() {
		OANDA.account.register('USD', function(response) {
			$scope.myaccount = response;
			acctId = response.accountId;
			$scope.operations = operations;
			$scope.side=operations[0];
			$scope.trailingStop = 100;
			$scope.takeProfit = 10;
			$scope.expiry = 1;
			$scope.price = 1002;
			$scope.$apply();
		});
	};

	$scope.createAccount();

	$scope.openMarketOrder = function(qty,action) {
		console.log(action + ":" + qty+":"+currencyPair);
		OANDA.order.open(acctId, currencyPair, qty, action, 'market', {
			'trailingStop': 100 }, function(response) {
			$scope.order = response;
			$scope.listTrade();
			$scope.$apply();
		});
	};

	$scope.openOrder = function(units,side,type,expiry,price) {
		OANDA.order.open(acctId, currencyPair, qty, action, type, {
			'trailingStop': 100
		}, function(response) {
			$scope.order = response;
			$scope.listTrade();
			$scope.$apply();
		});
	};

	$scope.openLimitOrder = function(units,side,expiry,price,takeProfit,trailingStop) {
		OANDA.order.open(acctId, currencyPair, units, side, 'limit', {
			'trailingStop': trailingStop,
			'takeProfit': takeProfit,
			'expiry':expiry,
			'price':price
		}, function(response) {
			$scope.order = response;
			$scope.listTrade();
			$scope.$apply();
		});
	};

	$scope.listTrade = function() {
		OANDA.trade.list(acctId, {
			instrument: currencyPair
		}, function(response) {
			$scope.trades = response;
			$scope.$apply();
		});
	};

	$scope.getRate = function getRates(myCurrencyPair) {
		OANDA.rate.quote([myCurrencyPair], function(response) {
			$scope.rates = response;
			$scope.$apply();
		});
	};

	$scope.getHistoricalRate = function getHistory(myCurrencyPair) {
		OANDA.rate.history(myCurrencyPair, {
			'granularity': "S5",
			'count': "2"
		}, function(response) {
			$scope.historicalRates = response;
			$scope.$apply();
		});
	};

	$scope.updateCurrency = function (myCurrencyPair) {
		console.log(myCurrencyPair);
		currencyPair = myCurrencyPair;
		$scope.getRate(myCurrencyPair);
		$scope.getHistoricalRate(myCurrencyPair);
	};

	$scope.getTransactionList = function transactionList() {
		OANDA.transaction.list(acctId, {
			'ids': '2347',
			'instrument': currencyPair
		}, function(response) {
			$scope.transList = response;
			$scope.$apply();
		});
	};

	$scope.getInstruments = function getInstruments() {
		OANDA.rate.instruments(['pip'], [''], function(response) {
			$scope.instruments = response.instruments;
			//$scope.currencyPair= response.instruments[0].instrument;
			$scope.$apply();
		});
	};

	$scope.getInstruments();
    $(document).ready(function() {
	$("#selectInst").find("[value='string:USD_ZAR']").attr("selected", "selected");
	$scope.$apply();
    });

	$scope.alert = function(msg) {
		alert(msg);
	};

});

