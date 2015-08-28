// JavaScript File

var app = angular.module('myApp', []);
var currencyPair = 'USD_ZAR';
var acctId = 7655624;
var operations = ["buy", "sell"];
var NoOfOrders = 1;
var pipDiff = 100;
var gridOffset = 0;
var OrderCount = [1, 5, 10, 15, 20, 50, 100];
var PipCount = [10, 50, 100, 1000];

if (!Array.prototype.some) {
	Array.prototype.some = function(fun /*, thisp*/ ) {
		var len = this.length;
		if (typeof fun != "function")
			throw new TypeError();

		var thisp = arguments[1];
		for (var i = 0; i < len; i++) {
			if (i in this && fun.call(thisp, this[i], i, this))
				return true;
		}
		return false;
	};
}

$(document).ready(function($scope) {
	$("#selectInst").find("[value='string:USD_ZAR']").attr("selected", "selected");

});


app.controller('myCtrl', function($scope) {

	$scope.operations = operations;
	$scope.OrderCount = OrderCount;
	$scope.PipCount = PipCount;
	$scope.currencyPair = currencyPair;
	$scope.pipDiff = 10;
	$scope.NoOfOrders = 5;
	$scope.side = operations[1];
	$scope.accountId = acctId;
	$scope.myaccount = acctId;
	var expiry = new Date();
	expiry.setDate(expiry.getDate() + 60);
	$scope.expiry = expiry.toJSON();
	0.

	$scope.createAccount = function() {
		OANDA.account.register('USD', function(response) {
			$scope.myaccount = response;
			acctId = response.accountId;
			$scope.$apply();
		});
	};

	$scope.getAccount = function() {
		OANDA.account.get(function(response) {
			$scope.myaccount = response;
			acctId = response.accountId;
			$scope.$apply();
		});
	};

	//$scope.getAccount();
	//$scope.createAccount();

	$scope.openMarketOrder = function(qty, action) {
		console.log(action + ":" + qty + ":" + currencyPair);
		OANDA.order.open(acctId, currencyPair, qty, action, 'market', {
			'trailingStop': 100
		}, function(response) {
			$scope.order = response;
			$scope.listTrade();
			$scope.$apply();
		});
	};

	$scope.openOrder = function(units, side, type, expiry, price) {
		OANDA.order.open(acctId, currencyPair, qty, action, type, {
			'trailingStop': 100
		}, function(response) {
			$scope.order = response;
			$scope.listTrade();
			$scope.$apply();
		});
	};

	$scope.openFixedPipOrder = function(currencyPair, units, side, pipdiff) {
		var expiry = new Date();
		expiry.setDate(expiry.getDate() + 60);
		var expiryDate = expiry.toJSON();
		var tp = 0;
		var ts = 50;
		var price = $scope.getRate(currencyPair)[0];
		var limitPrice = price.bid;
		var Ask = price.ask;
		var Bid = price.bid;
		var Point = $scope.pip;
		var minPipSize = (Ask - Bid) / Point;
		console.log("Minimum Pip Size:" + minPipSize);
		$scope.PipCount[0] = minPipSize;
		var GridSize = pipdiff;
		var GridSteps = units;
		var startrate = (Ask + Point * GridSize / 2) / Point / GridSize;
		var k = startrate;
		k = k * GridSize;
		startrate = k * Point - GridSize * GridSteps / 2 * Point;
		var traderate = startrate;
		var rate;
		console.log("start rate=" + startrate);
		for (var i = 0; i < units; i++) {
			if (side == $scope.operations[0]) {
				traderate = startrate + i * Point * GridSize + gridOffset * Point;
				rate = $scope.sround(traderate, Point, GridSize);
				tp = rate + pipdiff * Point;
			}
			else {
				traderate = startrate + i * Point * GridSize + gridOffset * Point;
				rate = $scope.sround(traderate, Point, GridSize);
				tp = rate - pipdiff * Point;
			}
			var orderExist = $scope.checkRateExist(rate);
			if (orderExist) {
				console.log("[" + i + "] Order exists @ " + rate);
			}
			else {
				console.log("[" + i + '] Trade opened @ ' + rate);
				if (side == $scope.operations[0]) {
					if (Ask < rate) {
						$scope.openStopOrder(1, side, expiryDate, rate, tp, ts);
					}
					else {
						$scope.openLimitOrder(1, side, expiryDate, rate, tp, ts);
					}
				}
				else {
					console.log(price + ":" + rate);
					if (Bid < rate) {
						$scope.openLimitOrder(1, side, expiryDate, rate, tp, ts);
					}
					else {
						$scope.openStopOrder(1, side, expiryDate, rate, tp, ts);
					}
				}
			}
		}
		setTimeout(function() {
			$scope.getOrders(currencyPair);
		}, 500);
	};

	$scope.checkRateExist = function(p) {
		if ($scope.checkTradeExist(p)) {
			return true;
		}
		if ($scope.checkOrderExist(p)) {
			return true;
		}
		return false;
	};

	$scope.checkTradeExist = function(p) {
		if (($scope.trades != null) && ($scope.trades.trades != null)) {
			var len = $scope.trades.trades.length;
			if (len < 1) {
				$scope.listTrade();
			}
			len = $scope.trades.trades.length;
			if (len > 0) {
				return $scope.checkExist(p, $scope.trades.trades);
			}
		}
		return false;
	};

	$scope.checkExist = function(p, ratelist) {
		return ratelist.some(function(item) {
			return (item.price == p)
		});
	};

	$scope.checkOrderExist = function(p) {
		if (($scope.orders != null) && ($scope.orders.orders != null)) {
			var len = $scope.orders.orders.length;
			if (len < 1) {
				$scope.getOrders(currencyPair);
			}
			len = $scope.orders.orders.length;
			if (len > 0) {
				return $scope.checkExist(p, $scope.orders.orders);
			}
		}
	};

	$scope.openLimitOrder = function(units, side, expiry, price, takeProfit, trailingStop) {
		OANDA.order.open(acctId, currencyPair, units, side, 'limit', {
			'trailingStop': trailingStop,
			'takeProfit': takeProfit,
			'expiry': expiry,
			'price': price
		}, function(response) {
			$scope.order = response;
		});
	};

	$scope.openStopOrder = function(units, side, expiry, price, takeProfit, trailingStop) {
		OANDA.order.open(acctId, currencyPair, units, side, 'stop', {
			'trailingStop': trailingStop,
			'takeProfit': takeProfit,
			'expiry': expiry,
			'price': price
		}, function(response) {
			$scope.order = response;
		});
	};

	$scope.openMarketIfTouchedOrder = function(units, side, expiry, price, takeProfit, trailingStop) {
		OANDA.order.open(acctId, currencyPair, units, side, 'marketIfTouched', {
			'trailingStop': trailingStop,
			'takeProfit': takeProfit,
			'expiry': expiry,
			'price': price
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

	$scope.updateCurrency = function(myCurrencyPair) {
		currencyPair = myCurrencyPair;
		for (var i in $scope.instruments) {
			if ($scope.instruments[i].instrument == currencyPair) {
				console.log(currencyPair + " pip value = " + $scope.instruments[i].pip);
				$scope.pip = $scope.instruments[i].pip;
			}
		}
		var price = $scope.getRate(myCurrencyPair);
		var Ask = price[0].ask;
		var Bid = price[0].bid;
		var Point = $scope.pip;
		var minPipSize = Math.round((Ask - Bid) / Point);
		console.log("Minimum Pip Size:" + minPipSize);
		$scope.PipCount[0] = minPipSize;
		$scope.getOrders(myCurrencyPair);
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

	$scope.getOrders = function orderList(myCurrencyPair) {
		OANDA.order.list(acctId, {
			'ids': '2347',
			'instrument': myCurrencyPair
		}, function(response) {
			$scope.orders = response;
			$scope.$apply();
		});
	};

	$scope.getInstruments = function getInstruments(acctId) {
		OANDA.rate.instruments(acctId, function(response) {
			$scope.instruments = response.instruments;
			$scope.$apply();
		});
	};

	$scope.getInstruments(acctId);

	$scope.alert = function(msg) {
		alert(msg);
	};

	$scope.sround = function round(p, point, size) {
		var rp = point * size;
		var iPoint = Math.round(1 / rp);
		var returnv = Math.round(p * iPoint) / iPoint;
		//console.log(p + ">" + returnv);
		return returnv;
	};
});
