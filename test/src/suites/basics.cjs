let 
	assert = require("uvu/assert"),
	timeout = require("../util/timeout.cjs");

module.exports = function (Cron, test) {

	test("new Cron(...) should not throw", function () {
		assert.not.throws(() => {
			let scheduler = new Cron("* * * * * *");
			scheduler.next();
		});
	});

	test("cron(...) without `new` should not throw", function () {
		assert.not.throws(() => {
			let scheduler = Cron("* * * * * *");
			scheduler.next();
		});
	});
	
	test("Scheduling two functions with the same instance is not allowed", function () {
		assert.throws(() => {
			let scheduler = new Cron("* * * * * *");
			scheduler.schedule((self) => { self.stop(); });
			scheduler.schedule((self) => { self.stop(); });
		});
	});

	test("Scheduling two functions with the same instance is not allowed (shorthand)", function () {
		assert.throws(() => {
			let scheduler = new Cron("* * * * * *", (self) => { self.stop(); });
			scheduler.schedule((self) => { self.stop(); });
		});
	});

	test("Array passed as next date should throw", function () {
		assert.throws(() => {
			let scheduler = new Cron("* * * * * *");
			scheduler.next([]);
		});
	});

	test("31st february should not be found", function () {
		assert.not.throws(() => {
			let scheduler = new Cron("* * * 31 2 *");
			assert.equal(scheduler.next(),null);
		});
	});

	test("Too high days should throw", function () {
		assert.throws(() => {
			let scheduler = new Cron("* * * 32 * *");
			scheduler.next();
		});
	});

	test("Too low days should throw", function () {
		assert.throws(() => {
			let scheduler = new Cron("* * * 0 * *");
			scheduler.next();
		});
	});

	test("Valid months should not throw", function () {
		assert.not.throws(() => {
			let scheduler = new Cron("* * * * 1,2,3,4,5,6,7,8,9,10,11,12 *");
			scheduler.next();
		});
	});

	test("Too high months should throw", function () {
		assert.throws(() => {
			let scheduler = new Cron("* * * * 7-13 *");
			scheduler.next();
		});
	});

	test("Too low months should throw", function () {
		assert.throws(() => {
			let scheduler = new Cron("* * * * 0-3 *");
			scheduler.next();
		});
	});

	test("Valid weekdays should not throw", function () {
		assert.not.throws(() => {
			let scheduler = new Cron("* * * * * 0,1,2,3,4,5,6,7");
			scheduler.next();
		});
	});

	test("Too high weekday should throw", function () {
		assert.throws(() => {
			let scheduler = new Cron("* * * * * 8");
			scheduler.next();
		});
	});

	test("Too low weekday should throw", function () {
		assert.throws(() => {
			let scheduler = new Cron("* * * * * -1");
			scheduler.next();
		});
	});
   
	test("Too high hours minute should throw", function () {
		assert.throws(() => {
			let scheduler = new Cron("* * 0,23,24 * * *");
			scheduler.next();
		});
	});
     

	test("Context is passed", timeout(2000, (resolve, reject) => {
		const 
			c = { a: "b" };
		Cron("* * * * * *", { context: c }, (self, context) => {
			self.stop();
			if (!context || (context && context.a && context.a !== "b")) {
				reject(new Error("Failure"));
			} else {
				resolve();
			}
		});
	}));

	test("Next 10 run times is returned by enumeration(), and contain a reasonable time span", () => {

		let 
			now = new Date(),
			nextRuns = Cron("*/30 * * * * *").enumerate(10);

		// Check number of times returned
		assert.equal(nextRuns.length, 10);

		// Check that time span of first entry is within a minute
		assert.equal(nextRuns[0].getTime() >= now.getTime(), true);
		assert.equal(nextRuns[0].getTime() <= now.getTime()+60*1000, true);

		// Check that time span of last entry is about 5 minutes from now
		assert.equal(nextRuns[9].getTime() > now.getTime()+4*60*1000, true);
		assert.equal(nextRuns[9].getTime() < now.getTime()+6*60*1000, true);

	});

	test("Next 10 run times is returned by enumeration(), and contain a reasonable time span, when using modified start time", () => {

		// 20 minutes before now
		let 
			now = new Date(new Date().getTime()-1200*1000),
			nextRuns = Cron("0 * * * * *").enumerate(10, now);

		// Check number of times returned
		assert.equal(nextRuns.length, 10);

		// Check that time span of first entry is within a minute
		assert.equal(nextRuns[0].getTime() >= now.getTime(), true);
		assert.equal(nextRuns[0].getTime() <= now.getTime()+61*1000, true);

		// Check that time span of last entry is about 10 minutes from 'now'
		assert.equal(nextRuns[9].getTime() > now.getTime()+9*60*1000, true);
		assert.equal(nextRuns[9].getTime() < now.getTime()+11*60*1000, true);

	});


	test("Impossible combination should result in null", function () {
		let impossible = Cron("0 0 0 30 2 6").next(new Date(1634076000000));
		assert.equal(null, impossible);
	});
	test("scheduled job should not stop on unhandled error with option catch: true",  timeout(4000, (resolve) => {
		let first = true;
		let job = Cron("* * * * * *",{catch: true},() => { 
			if (first) {
				first = false;
				throw new Error("E");
			}
			job.stop();
			resolve(); 
		});
	}));
	test("shorthand schedule without options should not throw, and execute",  timeout(2000, (resolve, reject) => {
		try {
			let job = Cron("* * * * * *",() => { job.stop(); resolve(); });
		} catch (e) {
			reject(e);
		}
	}));
	test("sanity check start stop resume", function () {
		let job = Cron("* * * 1 11 4",() => {});
		assert.not.throws(() => {
			job.pause();
			job.resume();
			job.stop();
		});
	});
	test("pause by options work",  timeout(2000, (resolve, reject) => {
		try {
			let job = Cron("* * * * * *",{paused:true},() => { throw new Error("This should not happen"); });
			setTimeout(function () {
				job.stop();
				resolve();
			},1500);
		} catch (e) {
			reject(e);
		}
	}));
	test("previous run time should be null if not yet executed", function () {
		let job = Cron("* * * 1 11 4",() => {});
		let result = job.previous();
		assert.equal(result,null);
		job.stop();
	});
	test("previous run time should be set if executed",  timeout(2000, (resolve, reject) => {
		let 
			scheduler = new Cron("* * * * * *", { maxRuns: 1 });
		scheduler.schedule(function () {});
		setTimeout(function () {
			let previous = scheduler.previous();
			// Do comparison
			try {
				assert.ok(previous>=new Date().getTime()-3000);
				assert.ok(previous<=new Date().getTime()+3000);
				scheduler.stop();
				resolve();
			} catch (e) {
				reject(e);
			}
		},1500);
	}));

	test("Isrunning should not throw, and return correct value after control functions is used", function () {
		let 
			scheduler0 = new Cron("0 0 0 * * 0");
		assert.equal(scheduler0.running(), false);
		scheduler0.schedule(() => {});
		assert.equal(scheduler0.running(), true);
		scheduler0.pause();
		assert.equal(scheduler0.running(), false);
		scheduler0.resume();
		assert.equal(scheduler0.running(), true);
		scheduler0.stop();
		assert.equal(scheduler0.running(), false);
	});

	test("maxRuns should be inherited from scheduler to job", function () {
		let scheduler = Cron("* * * 1 11 4", {maxRuns: 14}),
			job = scheduler.schedule(() => {});
		assert.equal(job.options.maxRuns,14);
		job.stop();
	});


	test("Test milliseconds to 01:01:01 XXXX-01-01 (most often next year), 1000s steps", function () {

		let prevRun = new Date(new Date().setMilliseconds(0)),
			target = new Date(new Date((prevRun.getFullYear()+1) + "-01-01 01:01:01").getTime()),
			scheduler = new Cron("1 1 1 1 1 *"),
			left,
			diff;

		assert.equal(target.getTime(),scheduler.next().getTime());
		if(target.getTime() === scheduler.next().getTime()) {
			while(prevRun < target) {
				left = scheduler.msToNext(prevRun);
				diff = Math.abs((target.getTime() - prevRun.getTime())-left);
				assert.ok(diff<=1000);
				assert.ok(diff>=0);

				// Advance 1000s
				prevRun.setMilliseconds(1000000);
			}
		}

	});
	test("Test milliseconds to 23:59:59 XXXX-01-01 (most often next year), 1000s steps", function () {

		let prevRun = new Date(new Date().setMilliseconds(0)),
			target = new Date(new Date((prevRun.getFullYear()+1) + "-01-01 23:59:59").getTime()),
			scheduler = new Cron("59 59 23 1 1 *"),
			left,
			diff;
		
		assert.equal(target.getTime(),scheduler.next().getTime());
		
		if(target.getTime() === scheduler.next().getTime()) {
			while(prevRun < target) {
				left = scheduler.msToNext(prevRun);
				diff = Math.abs((target.getTime() - prevRun.getTime())-left);
				assert.ok(diff<=1000);
				assert.ok(diff>=0);

				// Advance 1000s
				prevRun.setMilliseconds(1000000);
			}
		}

	});

	test("Test when next thursday 1st november occurr, starting from 2021-10-13 00:00:00", function () {
		assert.equal(Cron("0 0 0 1 11 4").next(new Date(1634076000000)).getFullYear(), 2029);
	});

	test("Next saturday at 29th of february should occur 2048. Also test weekday an month names and case insensitivity", function () {
		let nextSaturday29feb = Cron("0 0 0 29 feb SAT").next(new Date(1634076000000));
		assert.equal(nextSaturday29feb.getFullYear(),2048);
	});

	test("scheduler should be passed as first argument to triggered function",  timeout(2000, (resolve) => {
		let 
			scheduler = new Cron("* * * * * *", { maxRuns: 1 });
		scheduler.schedule(function (self) {
			assert.equal(self.options.maxRuns,0);
			assert.equal(typeof self.pause, "function");
			resolve();
		});
	}));

	test("0 0 0 * * * with 40 iterations should return 40 days from now", function () {
		let scheduler = new Cron("0 0 0 * * *"),
			prevRun = new Date(),
			nextRun,
			iterations = 40,
			compareDay = new Date();
			
		compareDay.setDate(compareDay.getDate() + iterations);
		
		while(iterations-->0) {
			nextRun = scheduler.next(prevRun),
			prevRun = nextRun;
		}

		// Set seconds, minutes and hours to 00:00:00
		compareDay.setMilliseconds(0);
		compareDay.setSeconds(0);
		compareDay.setMinutes(0);
		compareDay.setHours(0);

		// Do comparison
		assert.equal(nextRun.getTime(),compareDay.getTime());

	});

	test("0 * * * * * with 40 iterations should return 45 minutes from now", function () {
		let scheduler = new Cron("0 * * * * *"),
			prevRun = new Date(),
			nextRun,
			iterations = 45,
			compareDay = new Date(new Date().getTime()+45*60*1000);

		while(iterations-->0) {
			nextRun = scheduler.next(prevRun),
			prevRun = nextRun;
		}

		// Set seconds, minutes and hours to 00:00:00
		compareDay.setMilliseconds(0);
		compareDay.setSeconds(0);

		// Do comparison
		assert.equal(nextRun.getTime(),compareDay.getTime());

	});

	test("Fire-once should be supported by ISO 8601 string, past and .next() should return null", function () {
		let 
			scheduler0 = new Cron("2020-01-01T00:00:00");
		assert.equal(scheduler0.next(),null);
	});
	
	test("Fire-once should be supported by ISO 8601 string, future and .next() should return correct date", function () {
		let 
			scheduler0 = new Cron("2200-01-01T00:00:00"),
			nextRun = scheduler0.next();
		assert.equal(nextRun.getFullYear(), 2200);
		assert.equal(nextRun.getMonth(), 0);
		assert.equal(nextRun.getDate(), 1);
	});

	test("Fire-once should be supported by date, past and .next() should return null", function () {
		let 
			refTime = new Date(),
			twoSecsBeforeNow = new Date(refTime.getTime() - 2000),
			scheduler0 = new Cron(twoSecsBeforeNow),
			nextRun = scheduler0.next();
		assert.equal(nextRun, null);
	});


	test("Fire-once should be supported by date, future and .next() should return correct date", function () {
		let 
			refTime = new Date(),
			twoSecsFromNow = new Date(refTime.getTime() + 2000),
			scheduler0 = new Cron(twoSecsFromNow),
			nextRun = scheduler0.next();
		assert.equal(nextRun.getTime() > refTime.getTime(), true);
		assert.equal(nextRun.getTime() < refTime.getTime()+4000, true);
	});

};