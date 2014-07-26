function formattedTime() {
	var date = new Date();
	var ret = date.getDate() + "/";
	ret += (date.getMonth() + 1) + "/";
	ret += date.getFullYear() + " ";
	ret += date.getHours() + ":";
	ret += date.getMinutes() + ":";
	ret += date.getSeconds();
	return ret;
}

var alertsReader = {
	/**
   * where we are going to poll the alerts from
   */
	dataSource_: 'http://www.oref.org.il/WarningMessages/alerts.json',

	/**
	 * the last ID from the pikud. probably, ID change indicates possible alerts
	 */
	lastID_: "",

	/**
	 * current alerts
	 */
	currentAlerts_: [],
	
	/**
	 * div elements of alerts
	 * aggregated if there is no popup connected
	 */
	history_: [],

  /**
   * check pikud haoref for new alerts
   */
  pollAlerts: function() {
		var req = new XMLHttpRequest();
		req.open("GET", this.dataSource_, false);
		
		try {
			req.send(null);
		} catch(err) {
			console.log("error on reading data: " + err);
			return;
		}

		try {
			var obj = JSON.parse(req.responseText);
		} catch(err) {
			console.log("bad JSON input: " + req.responseText);
			return;
		}

		var ID = obj.id;
		if(this.lastID_ == ID) {
			return;
		}
		this.lastID_ = ID;

		delete this.currentAlerts_;
		this.currentAlerts_ = this.parseAlerts_(obj.data);

		if(this.currentAlerts_.length == 0) {
			return;
		}

		// notify the user
		this.notifyUser_();

		// dump alerts to log, just in case
		this.currentAlerts_.forEach(function(item) {
			console.log("ALERT: " + item.title + " " + item.message);
		});
  },

	/**
	 * get the data field from the JSON and parse the alerts
	 */
	parseAlerts_: function(rawData) {
		var ret = [];

		for(var i = 0;i<rawData.length;i++) {
			var space = rawData[i].lastIndexOf(" ");
			var index = rawData[i].substr(space + 1);
			var name = rawData[i].substr(0, space);
			ret.push({title: index, message: name});
		}
		return ret;
	},

	/**
	 * pop a notification with all of the alerts we've aggregated in this iteration
	 */
	notifyUser_: function() {
		var alertTime = formattedTime();
		var opt = {
			type: "list",
			title: "ALERTS",
			iconUrl: 'icon.png',
			priority: 2,
			message: "התראות צבע אדום בשעה " + alertTime,
			items: this.currentAlerts_
		};
		chrome.notifications.create("", opt, function(id) {
		});
	},

	/**
	 * put the given alert in the history (popup window)
	 */
	addToHistory_: function(alertData) {
		console.log("ALERT: " + alertData);
		this.history_.push(alertData);
	},

	/**
	 * clear the data we have
	 */
	clear: function() {
		this.lastID_ = "";
		this.currentAlerts_ = [];
		delete this.history_;
		this.history_ = [];
	}
};

/**
 * polling loop
 */
var alertsCallback = function() {
	alertsReader.pollAlerts();
	window.setTimeout(alertsCallback, 3000);
};

document.addEventListener('DOMContentLoaded', alertsCallback);