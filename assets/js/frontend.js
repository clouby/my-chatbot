// Based on blog post: https://www.sitepoint.com/how-to-build-your-own-ai-assistant-using-api-ai/
// Source code: https://github.com/sitepoint-editors/Api-AI-Personal-Assistant-Demo/blob/master/index.html.
// Demo: https://devdiner.com/demos/barry/
const error_internal = err => textResponse(myc_script_vars.messages.internal_error) && pos_req();
const handler_simple_error = prm => prm.catch(error_internal) && prm;
let auxMove = true;
let global_counter_cards  = 0;
let container_move = {};

class Cookie {
	static foundKeyCookie(name = "key") {
		const pass = document.cookie;
		return pass.split(";")
		 .map(data => {
			 const aux_obj = {}
			 const [key, value] = data.split("=");
			 aux_obj[key.trim()] = value;
			 return aux_obj;
		 }).find(data => data[name])
	};

	 static setPorpertyCookie(value, maxAge = 600, key = "key") {
		let cookieGenerate = "";
		if(!key || !value) return console.error("Incomplete values required.");
		cookieGenerate = `${key}=${value}; max-age=${maxAge}`;
		document.cookie = cookieGenerate;
	}
}

// When ready :)
 jQuery(document).ready(function() {

	$("#pop__up__chat").click(function(event){
		const self = $(this);
		self.addClass("disable_pop")
		.one("webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend", ({ originalEvent }) => {
			if(originalEvent.propertyName == "transform") {
				self.remove();
			}
		});
	});


	const circle_chat = document.getElementById("circle__chat");
	const arrow_back = document.querySelector(".myc-icon-toggle-up");
	/*
	 * Welcome
	 */
	if (myc_script_vars.enable_welcome_event && !Cookie.foundKeyCookie()) {
			localStorage.clear();
			Cookie.setPorpertyCookie("chat_bot");
			main_req({ event : 'welcome' })
		    .then(response => pos_req(response)
		    .then(hide_load) );
	} else if (Cookie.foundKeyCookie()) {
		appendConversation();
	 /* IN PROCESS */
	}


	/*
	 * When the user enters text in the text input text field and then the presses Enter key
	 */
	jQuery("input#myc-text").keypress(event => {
		if (event.which == 13) {
			event.preventDefault();
			jQuery("#myc-conversation-area .myc-conversation-request").removeClass("myc-is-active");
			var text = jQuery("input#myc-text").val();
			var date = new Date();
			jQuery("input#myc-text").val("");
			textQuery(text);
		}
	});

	function handler_click_opt(e) {
		e.preventDefault();
		const card_overlay = document.querySelector('.myc-content-overlay');
		const move_it = (auxMove) ? "1%" : "-90%";
		document.documentElement.style.setProperty('--responsiveright', move_it);
		auxMove = !auxMove;
	}

	arrow_back.addEventListener("click", handler_click_opt);
	/* Overlay slide toggleAPRENDIZ -> Dvbe¿w89*UBuc70%RCuc95= */
	circle_chat.addEventListener("click", handler_click_opt);
});

	/* Main Request */
	 function main_req(obj_send){
		const URL = `${myc_script_vars.base_url}query?v=${myc_script_vars.version_date}`;
		let key = "";
		const arr_obj = Object.keys(obj_send);
		const send_data = {
			lang : "en",
			sessionId: myc_script_vars.session_id,
		};
		send_data[arr_obj[0]] = (arr_obj[0] === 'event' && arr_obj.length == 1) ?
		{'name' : obj_send[arr_obj[0]].toLocaleUpperCase() } : obj_send[arr_obj[0]];

		const creds = {
			method: "POST",
			body: JSON.stringify(send_data),
			headers : new Headers({
				'Content-Type' : 'application/json',
				'Authorization' : `Bearer ${myc_script_vars.access_token}`
			})
		}
		return  handler_simple_error(fetch(URL, creds))
				.then(response => response.json())

	}

function appendConversation(html = "") {
	const auxStorage = localStorage.getItem("chat_bot") || "";
	const area_chat = jQuery("#myc-conversation-area");
 	if(auxStorage && !html) {
		area_chat.append(auxStorage);
		handler_load_contain(area_chat);
		return;
	}
	area_chat.append(html);
	localStorage.setItem("chat_bot", auxStorage + html);

}

function handler_load_contain(area) {
	const [pure_element] = area;
 	Array.from(document.querySelectorAll('.container_carrousel[id^=container_]'))
	.forEach(item => {
		let {id:idContainer} = item;
	   	idContainer = parseInt(idContainer.split("_")[1]);
		global_counter_cards = idContainer + 1;
		return item;
	})
	area.scrollTop(pure_element.lastElementChild.offsetTop);
}

function card_request(text) {
	var innerHTML = "<div class=\"myc-conversation-bubble-container myc-conversation-bubble-container-request\"><div class=\"myc-conversation-bubble myc-conversation-request myc-is-active\">" + text + " <div class=\"load__spin\"> </div> </div>";
	if (myc_script_vars.show_time) {
		innerHTML += "<div class=\"myc-datetime\">" + date.toLocaleTimeString() + "</div>";
	}
	innerHTML += "</div>";
	if (myc_script_vars.show_loading) {
		innerHTML += "<div class=\"myc-loading\"><i class=\"myc-icon-loading-dot\" /><i class=\"myc-icon-loading-dot\" /><i class=\"myc-icon-loading-dot\" /></div>";
	}
	appendConversation(innerHTML);
}

function pos_req(response) {
	const par = jQuery('.myc-conversation-bubble-container.myc-conversation-bubble-container-request').last()[0];
	const con = jQuery("#myc-conversation-area");
	const spin = jQuery('.myc-conversation-bubble.myc-conversation-request.myc-is-active .load__spin')
	return new Promise(resolve => {
		if (par) {
			con.css("padding-bottom", "30vh");
			spin.css("display", "block");
			con.scrollTop(par.offsetTop - con.height());
		}
		setTimeout(() => {
			if (response) prepareResponse(response);
			resolve({con, spin});
		}, 1000)
	})
}

function hide_load({con, spin}) {
	con.css("padding-bottom", "0vh");
	spin && spin.css("display", "none");
}
/**
 * Send Dialogflow query
 *
 * @param text
 * @returns
 */
 function textQuery(text) {
	if(!text) return;
	card_request(text.replace(/\_+/g, " "));
	main_req({query : text}).then(response => {
		pos_req(response).then(hide_load);
	});
}

/**
 * Handle Dialogflow response
 *
 * @param response
 */
function prepareResponse(response) {

	if (response.status.code == "200" ) {

		jQuery(window).trigger("myc_response_success", response);

		jQuery("#myc-conversation-area .myc-conversation-response").removeClass("myc-is-active");

		var messages = response.result.fulfillment.messages;
		var numMessages = messages.length;
		var index = 0;
		for (index; index<numMessages; index++) {
			var message = messages[index];

			if (myc_script_vars.messaging_platform == message.platform
					|| myc_script_vars.messaging_platform == "default" && message.platform === undefined
					|| message.platform === undefined && ! hasPlatform(messages, myc_script_vars.messaging_platform) ) {

				switch (message.type) {
				    case 0: // text response
						textResponse(message.speech);
				        break;
				    case 1: // card response
				        cardResponse(message.title, message.subtitle, message.buttons, message.text, message.postback);
				        break;
				    case 2: // quick replies
				    	quickRepliesResponse(message.title, message.replies);
				        break;
				    case 3: // image response
						imageResponse(message.imageUrl);
				        break;
					case 4: // custom payload
						// Only with facebook
						customPayloadResponse(message.payload.facebook.attachment.payload.elements);
				    default:
				}
			}
		}

	} else {
		textResponse(myc_script_vars.messages.internal_error);
	}

	if (jQuery("#myc-debug-data").length) {
		var debugData = JSON.stringify(response, undefined, 2);
		jQuery("#myc-debug-data").text(debugData);
	}
}

/**
 * Checks if messages support a specific platform
 *
 * @param messages
 * @param platform
 * @returns {Boolean}
 */
function hasPlatform(messages, platform) {
	var numMessages = messages.length;
	var index = 0;
	for (index; index<numMessages; index++) {
		var message = messages[index];
		if (message.platform === platform) {
			return true;
		}
	}

	return false;
}

/**
 * Displays a text response
 *
 * @param text
 * @returns
 */
function textResponse(text) {
	if (text === "") {
		text = myc_script_vars.messages.internal_error;
	}
	var date = new Date();
	var innerHTML = "<div class=\"myc-conversation-bubble-container myc-conversation-bubble-container-response\"><div class=\"myc-conversation-bubble myc-conversation-response myc-is-active myc-text-response\">" + text + "</div>";
	if (myc_script_vars.show_time) {
		innerHTML += "<div class=\"myc-datetime\">" + date.toLocaleTimeString() + "</div>";
	}
	innerHTML += "</div>";
	appendConversation(innerHTML);
}

/**
 * Displays a image response
 *
 * @param imageUrl
 * @returns
 */
function imageResponse(imageUrl) {
	if (imageUrl === "") {
		textResponse(myc_script_vars.messages.internal_error)
	} else {
		// FIXME wait for image to load by creating HTML first
		var date = new Date();
		var innerHTML = "<div class=\"myc-conversation-bubble-container myc-conversation-bubble-container-response\"><div class=\"myc-conversation-bubble myc-conversation-response myc-is-active myc-image-response\"><img src=\"" + imageUrl + "\"/></div>";
		if (myc_script_vars.show_time) {
			innerHTML += "<div class=\"myc-datetime\">" + date.toLocaleTimeString() + "</div>";
		}
		innerHTML += "</div>";
		appendConversation(innerHTML);
	}
}

/**
 * Card response
 *
 * @param title
 * @param subtitle
 * @param buttons
 * @param text
 * @param postback
 */
function cardResponse(title, subtitle, buttons, text, postback, imageUrl = null, redirect_url = null) {
	var html = "";

	if (imageUrl) {
		html += "<div class=\"myc-image-response\"><div class=\"wrapper_img\"><img src=\"" + imageUrl + "\"/></div></div>";
	}

	html += `<a href="${ redirect_url || '#'}" class="myc-card-title"> ${title}</a>`;

	html +=  (subtitle) ? "<div class=\"myc-card-subtitle\">" + subtitle + "</div>" : '';

	jQuery.each(buttons, function (index, item) {

		// if customPayloadResponse
		if (typeof item.title !== 'undefined') {
			item.text = item.title;
			item.postback = item.payload;
		}

		html += "<input type=\"button\" onclick=\"sendQuery('" + item.postback + "')\" class=\"myc-quick-reply\" value=\"" + item.text + "\" />";
	});

	appendConversation("<div class=\"myc-conversation-bubble-container myc-conversation-bubble-container-response\">" +
		"<div class=\"myc-conversation-bubble myc-conversation-response myc-is-active myc-quick-replies-response\">" + html + "</div>" +
		"</div>");
}

/**
 * Quick replies response
 *
 * @param title
 * @param replies
 */
function quickRepliesResponse(title, replies) {

	var html = "<div class=\"myc-quick-replies-title\">" + title + "</div>";

	var index = 0;
	for (index; index<replies.length; index++) {
		html += "<input type=\"button\" class=\"myc-quick-reply\" value=\"" + replies[index] + "\" />";
	}

	var date = new Date();
	var innerHTML = "<div class=\"myc-conversation-bubble-container myc-conversation-bubble-container-response\"><div class=\"myc-conversation-bubble myc-conversation-response myc-is-active myc-quick-replies-response\">" + html + "</div>";
	if (myc_script_vars.show_time) {
		innerHTML += "<div class=\"myc-datetime\">" + date.toLocaleTimeString() + "</div>";
	}
	innerHTML += "</div>";
	appendConversation(innerHTML);

	jQuery("#myc-conversation-area .myc-is-active .myc-quick-reply").click(function(event) {
		event.preventDefault();
		jQuery("#myc-conversation-area .myc-conversation-request").removeClass("myc-is-active");
		var text = jQuery(this).val()
		var date = new Date();
		var innerHTML = "<div class=\"myc-conversation-bubble-container myc-conversation-bubble-container-request\"><div class=\"myc-conversation-bubble myc-conversation-request myc-is-active\">" + text + "</div>";
		if (myc_script_vars.show_time) {
			innerHTML += "<div class=\"myc-datetime\">" + date.toLocaleTimeString() + "</div>";
		}
		if (myc_script_vars.show_loading) {
			innerHTML += "<div class=\"myc-loading\"><i class=\"myc-icon-loading-dot\" /><i class=\"myc-icon-loading-dot\" /><i class=\"myc-icon-loading-dot\" /></div>";
		}
		innerHTML += "</div>";
		appendConversation(innerHTML);
		textQuery(text);
	});

}

/**
 * Custom payload
 *
 * @param payload
 */
function customPayload(payload) {

}

/**
 * Custom payload
 *
 * @param element
 */
function customPayloadResponse(elements) {
	const aux_plans = [];
	let include  = null;
	elements.forEach((item, index) => {
		if(item.title.match(/PLAN/gi)) {
			if(!include) include = "container_carrousel";
			aux_plans.push(`
			<div id="card_${(new Date()).getTime() + index}" class="myc-conversation-bubble myc-conversation-response myc-is-active myc-quick-replies-response">
			<div class="myc-image-response">
				<div class="wrapper_img">
					<img src="${item.image_url}"/>
				</div>
			</div>
			<a href="${item.default_action.url}" class="myc-card-title">
				${item.title} <i class="ion-forward"></i>
			</a>
			<div class="myc-card-subtitle"> ${item.subtitle} </div>
			${item.buttons.map(btn => {
				if(btn.title) {
					btn.text = btn.title;
					btn.postback = btn.payload;
				}
				return `<input type="button" onclick="sendQuery('${btn.postback}')" class="myc-quick-reply" value="${btn.text}"/>`
			 }).join('')}
			 </div>
			 `);
		} else {
			cardResponse(item.title
				, item.subtitle
				, item.buttons
				, null
				, null
				, item.image_url
				, item.default_action && item.default_action.url)
		}
	});
	appendConversation(`
	<div class="myc-conversation-bubble-container myc-conversation-bubble-container-response">
		<div class="${include || ""}" id="${include ? `container_${global_counter_cards++}` : ""}">
			${include ? `<div class="arrows_obj">
			<button onclick="keepMove.apply(this, [event, -1])"><</button>
			<button onclick="keepMove.apply(this, [event, 1])">></button>
		</div>` : ""}
			${aux_plans.join('')}
		</div>
	</div>`);
}



function keepMove(event, number) {

	const { id:idParent } = this.parentElement.parentElement;
	const auxContainer = Array.from(document.querySelector(`#${idParent}`).children);
	const container = auxContainer.slice(1, (auxContainer.length));

 	container_move[idParent] = (container_move[idParent]||0) + number;

	 if(container_move[idParent] < 0) container_move[idParent] = 0;

	 if(container_move[idParent] > (container.length - 1)) {
		container_move[idParent] = container.length - 1;
		}

	container.forEach(card => {
		card.style.setProperty("display", "none", "important");
	});

	const [btn_first, btn_last] = document.querySelectorAll(`#${idParent} > .arrows_obj > button`);
	let toggle_last = (container_move[idParent] === 0) ? "none" : "block";
	let toggle_first = (container_move[idParent] ===  container.length - 1) ? "none" : "block";

	btn_first.style.setProperty("display", toggle_last, "important");

	btn_last.style.setProperty("display", toggle_first, "important");

	container[container_move[idParent]].style.setProperty("display", "flex", "important");
}

/**
 * Send payload
 * If it is a URL will open the link, if not, send payload
 *
 * @param payload
 */
function sendQuery(payload) {

	var regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;

	if (regex.test(payload)) {
		window.open(payload);
	} else {
		textQuery(payload);
	}
}
