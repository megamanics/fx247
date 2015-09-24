// JavaScript File

var app = angular.module('myApp', ['ui.grid']);
var currencyPair;
var acctId = 7655624;
var operations = ["buy", "sell"];
var NoOfOrders = 1;
var pipDiff = 100;
var gridOffset = 0;
var OrderCount = [1, 5, 10, 15, 20, 50, 100];
var PipCount = [10, 50, 100, 1000];
var trailingStop = 0;
var takeProfit = 100;

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


app.controller('myCtrl', ['uiGridConstants', function($scope,uiGridConstants) {

	$scope.operations = operations;
	$scope.OrderCount = OrderCount;
	$scope.PipCount = PipCount;
	$scope.pipDiff = 10;
	$scope.NoOfOrders = 5;
	$scope.side = operations[1];
	$scope.accountId = acctId;
	var expiry = new Date();
	expiry.setDate(expiry.getDate() + 60);
	$scope.expiry = expiry.toJSON();
	$scope.tGrid = {
		enableSorting: true,
		showGridFooter: true,
		columnDefs: [{
			field: 'id',
			maxWidth: 100,
			visible: true
		}, {
			field: 'units',
			maxWidth: 10,
			visible: true
		},{
			field: 'time',
			maxWidth: 250,
			cellFilter: 'date:\'MM/dd/yyyy h:mm:ss a\'',
			visible: true
		},{
			field: 'price',
			cellFilter: 'currency:USD:5',
			maxWidth: 100,
			visible: true
		}]
	};

	$scope.oGrid = {
		enableSorting: true,
		columnDefs: [{
			field: 'id',
			maxWidth: 100,
			visible: true
		}, {
			field: 'units',
			maxWidth: 10,
			visible: true
		},{
			field: 'time',
			maxWidth: 250,
			cellFilter: 'date:\'MM/dd/yyyy h:mm:ss a\'',
			visible: true
		},{
			field: 'price',
			cellFilter: 'currency:USD:5',
			maxWidth: 100,
			aggregationType: uiGridConstants.aggregationTypes.avg,
			visible: true
		},{
			field: 'takeProfit',
			cellFilter: 'currency:USD:5',
			maxWidth: 100,
			visible: true
		},{
			field: 'type',
			maxWidth: 50,
			visible: true
		}
		
		
		]
	};
	
	$scope.safeApply = function(fn) {
		var phase = this.$root.$$phase;
		if (phase == '$apply' || phase == '$digest') {
			if (fn && (typeof(fn) === 'function')) {
				fn();
			}
		}
		else {
			this.$apply(fn);
		}
	};

	$scope.createAccount = function() {
		OANDA.account.register('USD', function(response) {
			$scope.myaccount = response;
			acctId = response.accountId;
			$scope.safeApply();
		});
	};

	$scope.getAccount = function() {
		OANDA.account.get(function(response) {
			$scope.myaccount = response;
			acctId = response.accountId;
			$scope.safeApply();
		});
	};

	$scope.listAccount = function(acctId) {
		OANDA.account.listSpecific(acctId, function(response) {
			$scope.myaccount = response;
			acctId = response.accountId;
			$scope.safeApply();
		});
	};

	//$scope.getAccount();
	//$scope.createAccount();
	$scope.listAccount(acctId);

	$scope.openMarketOrder = function(qty, action) {
		console.log(action + ":" + qty + ":" + currencyPair);
		OANDA.order.open(acctId, currencyPair, qty, action, 'market', {
			'trailingStop': trailingStop
		}, function(response) {
			$scope.order = response;
			$scope.listTrade();
			$scope.safeApply();
		});
	};

	$scope.openOrder = function(units, side, type, expiry, price) {
		OANDA.order.open(acctId, currencyPair, qty, action, type, {
			'trailingStop': trailingStop
		}, function(response) {
			$scope.order = response;
			$scope.listTrade();
			$scope.safeApply();
		});
	};

	$scope.openFixedPipOrder = function(units, side, pipdiff) {
		var expiry = new Date();
		expiry.setDate(expiry.getDate() + 60);
		var expiryDate = expiry.toJSON();
		var tp = 0;
		var ts = 0;
		var price = $scope.getRate()[0];
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
				tp = rate + (takeProfit + pipdiff) * Point;
			}
			else {
				traderate = startrate + i * Point * GridSize + gridOffset * Point;
				rate = $scope.sround(traderate, Point, GridSize);
				tp = rate - (takeProfit + pipdiff) * Point;
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
			$scope.getOrders();
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
		if ($scope.tGrid.data != null) {
			var len = $scope.tGrid.data.length;
			if (len < 1) {
				$scope.listTrade();
			}
			len = $scope.tGrid.data.length;
			if (len > 0) {
				return $scope.checkExist(p, $scope.tGrid.data);
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
				$scope.getOrders();
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
			var trades = response;
			if (trades.trades != null) {
				$scope.tGrid.data = trades.trades;
				$scope.safeApply();
			}
		});
	};

	$scope.getRate = function getRates() {
		OANDA.rate.quote([currencyPair], function(response) {
			$scope.rates = response.prices;
			$scope.safeApply();
		});
		return $scope.rates;
	};

	$scope.getHistoricalRate = function getHistory() {
		OANDA.rate.history(currencyPair, {
			'granularity': "S5",
			'count': "2"
		}, function(response) {
			$scope.historicalRates = response;
			$scope.safeApply();
		});
	};

	$scope.updateCurrency = function() {
		currencyPair = $scope.currencyPair;
		for (var i in $scope.instruments) {
			if ($scope.instruments[i].instrument == currencyPair) {
				console.log(currencyPair + " pip value = " + $scope.instruments[i].pip);
				$scope.pip = $scope.instruments[i].pip;
			}
		}
		var price = $scope.getRate();
		if (price === undefined)
			var Ask = price[0].ask;
		var Bid = price[0].bid;
		var Point = $scope.pip;
		var minPipSize = Math.round((Ask - Bid) / Point);
		console.log("Minimum Pip Size:" + minPipSize);
		$scope.PipCount[0] = minPipSize;
		$scope.getOrders();
	};

	$scope.getTransactionList = function transactionList() {
		OANDA.transaction.list(acctId, {
			'ids': '2347',
			'instrument': currencyPair
		}, function(response) {
			$scope.transList = response;
			$scope.safeApply();
		});
	};

	$scope.getOrders = function orderList() {
		OANDA.order.list(acctId, {
			'ids': '2347',
			'instrument': currencyPair
		}, function(response) {
			$scope.orders = response;
			if((response != null) && (response.orders!=null))
			{
				$scope.oGrid.data = response.orders;
			}
			$scope.safeApply();
		});
	};

	$scope.closeOrder = function(orderID) {
		console.log("closeOrder:" + orderID);
		OANDA.order.close(acctId, orderID,
			function(response) {
				$scope.closeOrderResponse = response;
				console.log("CloseOrder Response:" + $scope.closeOrderResponse.toJSON);
				$scope.getOrders(currencyPair);
				$scope.safeApply();
			});
	};

	$scope.getInstruments = function getInstruments(acctId) {
		OANDA.rate.instruments(acctId, function(response) {
			$scope.instruments = response.instruments;
			$scope.safeApply();
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

	$scope.orderClosePopUp = function(index, orderID) {
		$scope.selectedRow = index;
		var el, x, y;

		el = document.getElementById('PopUp');
		if (window.event) {
			x = window.event.clientX + document.documentElement.scrollLeft + document.body.scrollLeft;
			y = window.event.clientY + document.documentElement.scrollTop +
				+document.body.scrollTop;
		}
		else {
			x = event.clientX + window.scrollX;
			y = event.clientY + window.scrollY;
		}
		x -= 2;
		y -= 2;
		y = y + 15
		el.style.left = x + "px";
		el.style.top = y + "px";
		el.style.display = "block";
		document.getElementById('PopUpText').innerHTML = orderID;
		document.getElementById('OrdCloseButton').onclick = function() {
			$scope.closeOrder(orderID);
		};

	};
}]);
