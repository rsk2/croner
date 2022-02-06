let 
	assert = require("uvu/assert");

// Actual tests
module.exports = function (Cron, test) {

	test("DST/Timezone", function () {
		let 
			dayOne = new Date("2021-10-31T20:00:00"), // Last day of DST
			scheduler = new Cron("0 0 12 * * *", {timezone: "Etc/UTC", startAt: dayOne }),
			nextRun = scheduler.next(); // Next run in local time

		// Do comparison
		assert.equal(nextRun.getUTCHours(), 12);

	});

	test("getTime should return expected difference with different timezones (now)", function () {
		let timeStockholm = Cron("* * * * * *", {timezone: "Europe/Stockholm"}).next().getTime(),
			timeNewYork = Cron("* * * * * *", {timezone: "America/New_York"}).next().getTime();

		// The time right now should be the same in utc wether in new york or stockholm
		assert.ok(timeStockholm>=timeNewYork-4000);
		assert.ok(timeStockholm<=timeNewYork+4000);
	});
	test("getTime should return expected difference with different timezones (next 31st october)", function () {

		let refTime = new Date();
		refTime.setFullYear(2021);
		refTime.setMonth(8);

		let
			timeStockholm = Cron("0 0 0 31 10 *", {timezone: "Europe/Stockholm"}).next(refTime).getTime(),
			timeNewYork = Cron("0 0 0 31 10 *", {timezone: "America/New_York"}).next(refTime).getTime(),
			diff = (timeNewYork-timeStockholm)/1000/3600;

		// The time when next sunday 1st november occur should be with 6 hours difference (seen from utc)
		assert.equal(diff,6);
	});

	test("getTime should return expected difference with different timezones (next 1st november)", function () {
		let timeStockholm = Cron("0 0 0 1 11 *", {timezone: "Europe/Stockholm"}).next().getTime(),
			timeNewYork = Cron("0 0 0 1 11 *", {timezone: "America/New_York"}).next().getTime(),
			diff = (timeNewYork-timeStockholm)/1000/3600;

		// The time when next sunday 1st november occur should be with 6 hours difference (seen from utc)
		assert.equal(diff,5);
	});
	
};