var interval = 100000;
$(function () {
	changeAvInfo();
	setInterval(changeAvInfo, interval);
});

//var from;
//var to = getDateTimeString(new Date((new Date()).valueOf() - interval));

function changeAvInfo () {
	from = '1min'
	$.ajax({
		dataType: "jsonp",
		url: 'http://avms.dit.in.ua/api/antiviruses',
		data: {
			'fields' : ['id', 'full_name'],
			'active' : 1,
			'limit' : 100,
		},
		success: function (antiviruses) {
			if (antiviruses['status'] == 200) {
				$.ajax({
					dataType: "jsonp",
					url: 'http://avms.dit.in.ua/api/results',
					data: {
						'file_id' : 35,
						'from' : from,
					},
					success: function (data) {
						if (data['status'] == 200) {
							getTime(function (time) {
								var stats = getAvStats(antiviruses['result'], data['result'], time);
								$(placeholder).html('Updated: ' + 
									(new Date).toString() + '<br>' +
									getHtml(stats));
							});	
						} else {
							//alert(data['status'] + ' ' + data['message']);
						}
					},
					error: function (jqXHR, status, err) {
						$(placeholder).text('status: ' + jqXHR['status'] + '\nerror: ' + err + '\nResponse:' + JSON.stringify(jqXHR));
					}
				});
			} else {
				//alert(antiviruses['status'] + ' ' + antiviruses['message']);
			}
		},
		error: function (jqXHR, status, err) {
			$(placeholder).text('status: ' + jqXHR['status'] + '\nerror: ' + err + '\nResponse: ' + JSON.stringify(jqXHR));
		}
	});
}

function getTime(next) {
	accumulateResults([], 0, next);
}

function accumulateResults(results, offset, next) {
	$.ajax({
		dataType: "jsonp",
		url: "http://avms.dit.in.ua/api/results",
		data: {
			file_id: 35,
			limit: 100,
			'offset': offset
		},
		success: function (data) {
			//console.log('results: ' + JSON.stringify(results) + '\n');
			results = results.concat(data.result);
			if (data.result.length < 100) {
				next(results);
			} else {
				accumulateResults(results, offset + 100, next);
			}
		},
		error: function (jqXHR, status, err) {
			if (jqXHR.status == 400) {
				next(results);
			} else {
				$(placeholder).text('status: ' + jqXHR['status'] + '\nerror: ' + err + '\nResponse: ' + JSON.stringify(jqXHR));
			}
		}
	});
}

function findInArray (arr, key, value) {
	for (var i = 0; i < arr.length; i++) {
		// console.log(arr[i]);
		if (arr[i][key] == value) {
			return i;
		}
	}
	return -1;
}

function getAvStats(avs, data, timeResults) {
	//console.log('avs: ' + JSON.stringify(avs));
	//console.log('data: ' + JSON.stringify(data));
	var stats = [];
	for (var i = avs.length - 1 ; i >= 0; i--) {
		var av = avs[i];
		var res_ind = findInArray(data, 'av_id', av['id']);
		var name = av['full_name'];
		var info;
		if (res_ind != -1) {
			var result = data[res_ind];
			//console.log('result: ' + JSON.stringify(result) + '\n');
			if (isWorking(result)) {
				info = { 'id': av['id'], 'name': name, 'working': 1 };
			} else {
				//console.log(JSON.stringify(av));
				//console.log(name);
				info = { 'id': av['id'], 'name': name, 'working': 0 };
			}
		} else {
			info = {'id' : av['id'], 'name' : name, 'working' : 0};
		}

		var time = undefined;

		//console.log('timeResults length: ' + timeResults.length);
		
		for (var j = timeResults.length - 1; j >= 0; j--) {
			if (timeResults[j].av_id == av.id) {
				if (isWorking(timeResults[j]) == info.working && timeResults[j].time) {
					//console.log('time: ' + timeResults[j].time);
					time = timeResults[j].time;
				} else {
					//console.log('res: ' + JSON.stringify(timeResults[j]));
					//console.log('time: ' + timeResults[j].time + '\n');
					break;
				}
			} 
		}

		info.time = time;
		//console.log('info: ' + JSON.stringify(info) + '\n');
		var prev = findInArray(stats, 'id', av['id']);
		if (prev != -1) {
			if (result['time'] > stats[prev]['time']) {
				stats[prev] = info;
			}
		} else {
			stats.push(info);
		}
	}
	stats.sort(function (a, b) {
		if (a['id'] > b['id']) 
			return 1;
		if (a['id'] < b['id'])
			return -1;
		return 0;
	});
	//console.log('stats: ' + JSON.stringify(stats));
	return stats;
}

function isWorking(result) {
	return result.result.toLowerCase().indexOf('eicar') != -1;
}

function getHtml(data) {
	var result = '<table>';
	for (var i = 0; i < data.length; i++) {
		var row = data[i];
		result += '<tr>';
		result += '<td>';
		result += row['name'];
		result += '</td>';
		result += '<td>';
		result += getCircle(row['working']);
		result += '</td>';

		var status = row.working ? '<b>UP</b>   ' : '<b>DOWN</b>   ';
		result += '<td>';
		//console.log('time: ' + typeof row.time);
		result += status + (row.time ? 'from ' +  new Date(row.time).toString() : '<b>forever</b>');
		result += '</td>';
		result += '</tr>';
	}
	result += '</table>';
	return result;
}

//function getCircle(working) {
//	var color = working ? 'green' : 'red';
//	return '<svg><circle cx="20" cy="20" r="20" fill="' + color + '"/></svg>';
//}

function getCircle(working) {
	var name = working ? 'yes' : 'no';
	return '<img src="img/' + name + '.jpg" witdh="40" height="40"/>';
}