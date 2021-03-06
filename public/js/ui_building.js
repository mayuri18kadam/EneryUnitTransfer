/* global bag, $, ws*/
/* global escapeHtml, toTitleCase, formatDate, known_companies, transfer_marble, record_company, show_tx_step, refreshHomePanel, auditingMarble*/
/* exported build_marble, record_company, build_user_panels, build_company_panel, build_notification, populate_users_marbles*/
/* exported build_a_tx, marbles */

var marbles = {};

// =================================================================================
//	UI Building
// =================================================================================
//build a energy unit
function build_marble(marble) {
	var html = '';
	var colorClass = '';
	var size = 'smallMarble';
	var auditing = '';

	marbles[marble.id] = marble;
	marble.size = 'smallMarble';
	marble.id = escapeHtml(marble.id);
	marble.color = escapeHtml(marble.color);
	marble.owner.id = escapeHtml(marble.owner.id);
	marble.owner.username = escapeHtml(marble.owner.username);
	marble.owner.company = escapeHtml(marble.owner.company);
	var full_owner = escapeHtml(marble.owner.username.toLowerCase() + '.' + marble.owner.company);

	console.log('[ui] building marble: ', marble.color, full_owner, marble.id.substring(0, 4) + '...');
	if (marble.size == 16) size = 'smallMarble';
	if (marble.color) colorClass = marble.color.toLowerCase() + 'bg';

	if(auditingMarble && marble.id ===  auditingMarble.id) auditing = 'auditingMarble';

	html += '<span id="' + marble.id + '" class="ball ' + size + ' ' + colorClass + ' ' + auditing + ' title="' + marble.id + '"';
	html += ' username="' + marble.owner.username + '" company="' + marble.owner.company + '" owner_id="' + marble.owner.id + '"><img src="http://hddfhm.com/images/animated-bolt-of-lightning-clipart-4.gif" alt="Smiley face" width="42" height="42"></span>';

	$('.marblesWrap[owner_id="' + marble.owner.id + '"]').find('.innerMarbleWrap').prepend(html);
	$('.marblesWrap[owner_id="' + marble.owner.id + '"]').find('.noMarblesMsg').hide();
	return html;
}

//redraw the user's energy units
function populate_users_marbles(msg) {

	//reset
	console.log('[ui] clearing energy units for user ' + msg.owner_id);
	$('.marblesWrap[owner_id="' + msg.owner_id + '"]').find('.innerMarbleWrap').html('<i class="fa fa-plus addMarble"></i>');
	$('.marblesWrap[owner_id="' + msg.owner_id + '"]').find('.noMarblesMsg').show();

	for (var i in msg.marbles) {
		build_marble(msg.marbles[i]);
	}
}

//crayp resize - dsh to do, dynamic one
function size_user_name(name) {
	var style = '';
	if (name.length >= 10) style = 'font-size: 22px;';
	if (name.length >= 15) style = 'font-size: 18px;';
	if (name.length >= 20) style = 'font-size: 15px;';
	if (name.length >= 25) style = 'font-size: 11px;';
	return style;
}

//build all user panels
function build_user_panels(data) {

	//reset
	console.log('[ui] clearing all user panels');
	$('.ownerTable').html('');
	for (var x in known_companies) {
		known_companies[x].count = 0;
		known_companies[x].visible = 0;							//reset visible counts
	}

	for (var i in data) {
		var html = '';
		var colorClass = '';
		data[i].id = escapeHtml(data[i].id);
		data[i].username = escapeHtml(data[i].username);
		data[i].company = escapeHtml(data[i].company);
		record_company(data[i].company);
		known_companies[data[i].company].count++;
		known_companies[data[i].company].visible++;

		console.log('[ui] building owner panel ' + data[i].id);

		/*html += '<div id="user' + i + 'none" username="' + data[i].username + '" company="' + data[i].company +
			'" owner_id="' + data[i].id + '" class="marblesWrap ' + colorClass + '">';
		html += '<div class="legend" style="' + size_user_name(data[i].username) + '">';
		html += toTitleCase(data[i].username);
		html += '<span class="fa fa-thumb-tack marblesCloseSectionPos marblesFix" title="Never Hide Owner"></span>';
		html += '</div>';
		html += '<div class="innerMarbleWrap"><i class="fa fa-plus addMarble"></i></div>';
		html += '<div class="noMarblesMsg hint">No marbles</div>';
		html += '</div>';*/

		// My code, adds user information to the table
		var table = '';
		table += '<tr id="user' + i + 'row" username="' + data[i].username + '" company="' + data[i].company +
			'" owner_id="' + data[i].id + '">';
		table += '<td>' + data[i].username + '</td>';
		table += '<td>';

		table += '<div id="user' + i + 'wrap" username="' + data[i].username + '" company="' + data[i].company +
			'" owner_id="' + data[i].id + '" class="marblesWrap ' + colorClass + '">';
		table += '<div class="legend" style="' + size_user_name(data[i].username) + '">';
		table += toTitleCase(data[i].username);
		table += '<span class="fa fa-thumb-tack marblesCloseSectionPos marblesFix" title="Never Hide Owner"></span>';
		table += '</div>';
		table += '<div class="innerMarbleWrap"><i class="fa fa-plus addMarble"></i></div>';
		table += '<div class="noMarblesMsg hint">No marbles</div>';
		table += '</div>';

		table +='</td>';

		table += '</tr>' ;

		//$('.ownerTable').append(table);

		//end of my code


		$('.companyPanel[company="' + data[i].company + '"]').find('.ownerTable').append(table);
		$('.companyPanel[company="' + data[i].company + '"]').find('.companyVisible').html(known_companies[data[i].company].visible);
		$('.companyPanel[company="' + data[i].company + '"]').find('.companyCount').html(known_companies[data[i].company].count);
	}

	//drag and drop energy unit
	$('.innerMarbleWrap').sortable({ connectWith: '.innerMarbleWrap', items: 'span' }).disableSelection();
	$('.innerMarbleWrap').droppable({
		drop:
		function (event, ui) {
			var marble_id = $(ui.draggable).attr('id');

			//  ------------ Delete energy unit ------------ //
			if ($(event.target).attr('id') === 'trashbin') {
				console.log('removing energy unit', marble_id);
				show_tx_step({ state: 'building_proposal' }, function () {
					var obj = {
						type: 'delete_marble',
						id: marble_id,
						v: 1
					};
					ws.send(JSON.stringify(obj));
					$(ui.draggable).addClass('invalid bounce');
					refreshHomePanel();
				});
			}

			//  ------------ Transfer energy unit ------------ //
			else {
				var dragged_owner_id = $(ui.draggable).attr('owner_id');
				var dropped_owner_id = $(event.target).parents('.marblesWrap').attr('owner_id');

				console.log('dropped a energy unit', dragged_owner_id, dropped_owner_id);
				if (dragged_owner_id != dropped_owner_id) {										//only transfer energy units that changed owners
					$(ui.draggable).addClass('invalid bounce');
					transfer_marble(marble_id, dropped_owner_id);
					var obj = {
						type: 'delete_marble',
						id: marble_id,
						v: 1
					};
					ws.send(JSON.stringify(obj));
					return true;
				}
			}
		}
	});

	//user count
	$('#foundUsers').html(data.length);
	$('#totalUsers').html(data.length);
}

//build company wrap
function build_company_panel(company) {
	company = escapeHtml(company);
	console.log('[ui] building company panel ' + company);

	var mycss = '';
	if (company === escapeHtml(bag.marble_company)) mycss = 'myCompany';

	var html = '';
	html += '<div class="companyPanel" company="' + company + '">';
	html += '<div class="companyNameWrap ' + mycss + '">';
	html += '<span class="companyName">' + company + '&nbsp;-&nbsp;</span>';
	html += '<table class="ownerTable" >';
	html += '<tr colspan="2">';
	html += '<th>' + company + '</th>';
	html += '</tr>';

	html += '<tr><th>Users</th><th>Excess</th></tr>'
	html += '</table><br/>';
	html += '<span class="companyVisible">0</span>/';
	html += '<span class="companyCount">0</span>';
	if (company === escapeHtml(bag.marble_company)) {
		html += '<span class="fa fa-exchange floatRight"></span>';
	}
	else {
		html += '<span class="fa fa-long-arrow-left floatRight"></span>';
	}
	html += '</div>';
// My code starts here
	html += '<div class="ownerWrap">';


	html += '</div>';



// My code ends here
	html += '</div>';
	$('#allUserPanelsWrap').append(html);
}

//build a notification msg, `error` is boolean
function build_notification(error, msg) {
	var html = '';
	var css = '';
	var iconClass = 'fa-check';
	if (error) {
		css = 'warningNotice';
		iconClass = 'fa-minus-circle';
	}

	html += '<div class="notificationWrap ' + css + '">';
	html += '<span class="fa ' + iconClass + ' notificationIcon"></span>';
	html += '<span class="noticeTime">' + formatDate(Date.now(), '%M/%d %I:%m:%s') + '&nbsp;&nbsp;</span>';
	html += '<span>' + escapeHtml(msg) + '</span>';
	html += '<span class="fa fa-close closeNotification"></span>';
	html += '</div>';
	return html;
}


//build a tx history div
function build_a_tx(data, pos) {
	var html = '';
	var username = '-';
	var company = '-';
	var id = '-';
	if(data &&  data.value && data.value.owner && data.value.owner.username) {
		username = data.value.owner.username;
		company = data.value.owner.company;
		id = data.value.owner.id;
	}

	html += '<div class="txDetails">';
	html +=		'<div class="txCount">TX ' + (Number(pos) + 1) + '</div>';
	html +=		'<p>';
	html +=			'<div class="marbleLegend">Transaction: </div>';
	html +=			'<div class="marbleName txId">' + data.txId.substring(0, 14) + '...</div>';
	html +=		'</p>';
	html +=		'<p>';
	html +=			'<div class="marbleLegend">Owner: </div>';
	html +=			'<div class="marbleName">' + username + '</div>';
	html +=		'</p>';
	html +=		'<p>';
	html +=			'<div class="marbleLegend">Company: </div>';
	html +=			'<div class="marbleName">' + company  + '</div>';
	html +=		'</p>';
	html +=		'<p>';
	html +=			'<div class="marbleLegend">Ower Id: </div>';
	html +=			'<div class="marbleName">' + id  + '</div>';
	html +=		'</p>';
	html +=	'</div>';
	return html;
}
