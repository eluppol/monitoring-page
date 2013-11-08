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
							stats = getAvStats(antiviruses['result'], data['result']);
							$(placeholder).html('Updated: ' + 
								(new Date).toString() + '<br>' +
								getHtml(stats));
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

function findInArray (arr, key, value) {
	for (var i = 0; i < arr.length; i++) {
		// console.log(arr[i]);
		if (arr[i][key] == value) {
			return i;
		}
	}
	return -1;
}

function getAvStats(avs, data) {
	console.log('avs: ' + JSON.stringify(avs));
	console.log('data: ' + JSON.stringify(data));
	var stats = [];
	for (var i = avs.length - 1 ; i >= 0; i--) {
		var av = avs[i];
		var res_ind = findInArray(data, 'av_id', av['id']);
		console.log(res_ind);
		var name = av['full_name'];
		var info;
		if (res_ind != -1) {
			var result = data[res_ind];
			if (result['result'].toLowerCase().indexOf('eicar') != -1) {
				info = { 'id': av['id'], 'name': name, 'working': 1 };
			} else {
				console.log(JSON.stringify(av));
				console.log(name);
				info = { 'id': av['id'], 'name': name, 'working': 0 };
			}
		} else {
			info = {'id' : av['id'], 'name' : name, 'working' : 0};
		}
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
	console.log('stats: ' + JSON.stringify(stats));
	return stats;
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