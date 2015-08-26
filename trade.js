// JavaScript File

var app = angular.module('myApp', []);
var currencyPair = 'USD_ZAR';
var acctId = 0;
var operations = ["buy","sell"];
var NoOfOrders = 1;
var pipDiff = 100;
var gridOffset = 0;
var OrderCount = [1,5,10,15,20,50,100];
var PipCount   = [1,10,100,1000];


$(document).ready(function() {
	$("#selectInst").find("[value='string:USD_ZAR']").attr("selected", "selected");

});


app.controller('myCtrl', function($scope) {


	$scope.createAccount = function() {
		OANDA.account.register('USD', function(response) {
			$scope.myaccount = response;
			acctId = response.accountId;
			$scope.operations = operations;
			$scope.OrderCount 	= OrderCount;
			$scope.PipCount		= PipCount;
			$scope.currencyPair = currencyPair;
			$scope.pipDiff 		= 10;
			$scope.NoOfOrders	= 5;
			$scope.side=operations[0];
			var expiry = new Date();
			expiry.setDate(expiry.getDate() + 60);
			$scope.expiry = expiry.toJSON();0.
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
	
	$scope.openFixedPipOrder = function(currencyPair,units,side,pipdiff) {
		var expiry = new Date();
		expiry.setDate(expiry.getDate() + 60);
		var expiryDate = expiry.toJSON();
		var tp = 0;
		var ts = 10;
		var price = $scope.getRate(currencyPair)[0];
		var limitPrice = price.bid;
		var Ask = price.ask;
		var Point = $scope.pip;
		var GridSize = pipdiff;
		var GridSteps = units;
		var startrate = ( Ask + Point*GridSize/2 ) / Point / GridSize;
        var    k = startrate ;
        k = k * GridSize ;
        startrate = k * Point - GridSize*GridSteps/2*Point;
        var traderate = startrate;
        var rate;
		console.log("start rate=" + startrate);
		for (var i = 0; i < units; i++) 
		{
			if(side == $scope.operations[0])
			{
				traderate   = startrate + i*Point*GridSize + gridOffset*Point;
				rate  		= $scope.sround(traderate,Point,GridSize);
				tp 			= rate + pipdiff*Point;
			} else 
			{
				traderate 	= startrate + i*Point*GridSize + gridOffset*Point;
				rate  		= $scope.sround(traderate,Point,GridSize);
				tp 			= rate - pipdiff*Point;
			}
			console.log(i + ' trade =' + rate);
			$scope.openLimitOrder(1,side,expiryDate,rate,tp,ts);
		}
		setTimeout(function(){ 
			$scope.getTransactionList(currencyPair);
    	}, 500);  
	};

	$scope.openLimitOrder = function(units,side,expiry,price,takeProfit,trailingStop) {
		OANDA.order.open(acctId, currencyPair, units, side, 'limit', {
			'trailingStop': trailingStop,
			'takeProfit': takeProfit,
			'expiry':expiry,
			'price':price
		}, function(response) {
			$scope.order = response;
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
			$scope.rates = response.prices;
			$scope.$apply();
		});
		return $scope.rates;
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
		currencyPair = myCurrencyPair;
		for (var i in $scope.instruments) {
  			if ($scope.instruments[i].instrument == currencyPair) {
    			console.log(currencyPair + " pip value = " + $scope.instruments[i].pip);
    			$scope.pip = $scope.instruments[i].pip;
  			}
		}
		$scope.getRate(myCurrencyPair);
		$scope.getHistoricalRate(myCurrencyPair);
		$scope.getTransactionList(myCurrencyPair);
	};

	$scope.getTransactionList = function transactionList(myCurrencyPair) {
		OANDA.transaction.list(acctId, {
			'ids': '2347',
			'instrument': myCurrencyPair
		}, function(response) {
			$scope.transList = response;
			$scope.$apply();
		});
	};

	$scope.getInstruments = function getInstruments() {
		OANDA.rate.instruments(['pip'], [''], function(response) {
			$scope.instruments = response.instruments;
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
	
	$scope.sround = function round(p,point,size) {
		var rp = point * size;
		var iPoint = Math.round(1/rp);
		var returnv = Math.round(p*iPoint)/iPoint;
		console.log(p + ">" + returnv);
		return returnv;
	}

});

