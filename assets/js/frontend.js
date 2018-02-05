
// Based on blog post: https://www.sitepoint.com/how-to-build-your-own-ai-assistant-using-api-ai/
// Source code: https://github.com/sitepoint-editors/Api-AI-Personal-Assistant-Demo/blob/master/index.html.
// Demo: https://devdiner.com/demos/barry/

// When ready :)
const error_internal = (err) => textResponse(myc_script_vars.messages.internal_error) && pos_req();
const handler_simple_error = prm => prm.catch(error_internal) && prm;

jQuery(document).ready(function() {

	/*
	 * Welcome
	 */
	if (myc_script_vars.enable_welcome_event) {
		(async function(){
			const response = await main_req({event : 'welcome'});
			pos_req(response).then(hide_load);
		})();
	}


	/*
	 * When the user enters text in the text input text field and then the presses Enter key
	 */
	jQuery("input#myc-text").keypress(function(event) {
		if (event.which == 13) {
			event.preventDefault();
			jQuery("#myc-conversation-area .myc-conversation-request").removeClass("myc-is-active");
			var text = jQuery("input#myc-text").val();
			var date = new Date();
			jQuery("input#myc-text").val("");
			textQuery(text);
		}
	});


	/* Overlay slide toggle */
	jQuery(".myc-content-overlay .myc-content-overlay-header").click(function(event){

		if (jQuery(this).find(".myc-icon-toggle-up").css("display") !== "none") {
			jQuery(this).find(".myc-icon-toggle-up").hide();
			jQuery(this).parent().removeClass("myc-toggle-closed");
			jQuery(this).parent().addClass("myc-toggle-open");
			jQuery(this).find(".myc-icon-toggle-down").show();
			jQuery(this).siblings(".myc-content-overlay-container").slideToggle("slow", function() {});
		} else {
			jQuery(this).find(".myc-icon-toggle-down").hide();
			jQuery(this).parent().removeClass("myc-toggle-open");
			jQuery(this).parent().addClass("myc-toggle-closed");
			jQuery(this).find(".myc-icon-toggle-up").show();
			jQuery(this).siblings(".myc-content-overlay-container").slideToggle("slow", function() {});
		}
	});

});

	/* Main Request */
	async function main_req(obj_send){
		const URL = `${myc_script_vars.base_url}query?v=${myc_script_vars.version_date}`;

		const arr_obj = Object.keys(obj_send);

		if(arr_obj[0] === 'event' && arr_obj.length == 1) {
			 obj_send['event'] = { 'name' : obj_send['event'].toLocaleUpperCase() }
		};

		const send_data = {
			lang : "en",
			sessionId: myc_script_vars.session_id,
			...obj_send
		};
		const creds = {
			method: "POST",
			body: JSON.stringify(send_data),
			headers : new Headers({
				'Content-Type' : 'application/json',
				'Authorization' : `Bearer ${myc_script_vars.access_token}`
			})
		}
		return await(await handler_simple_error(fetch(URL, creds))).json();

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
	jQuery("#myc-conversation-area").append(innerHTML);
}

function pos_req(response) {
	const par = jQuery('.myc-conversation-bubble-container.myc-conversation-bubble-container-request').last()[0];
	const con = jQuery("#myc-conversation-area");
	return new Promise(resolve => {
		if (par) {
			con.css("padding-bottom", "330px");
			con.scrollTop(par.offsetTop - con.height());
		}
		setTimeout(() => {
			if (response) prepareResponse(response);
			resolve(con);
		}, 1000)
	})
}

function hide_load(con) {
	con.css("padding-bottom", "0px");
	jQuery('.myc-conversation-bubble.myc-conversation-request.myc-is-active .load__spin')
	.css("display", "none");
}
/**
 * Send Dialogflow query
 *
 * @param text
 * @returns
 */
async function textQuery(text) {
	if(!text) return;
	card_request(text);
	const response = await main_req({query : text});
	pos_req(response).then(hide_load);
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
	jQuery("#myc-conversation-area").append(innerHTML);
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
		jQuery("#myc-conversation-area").append(innerHTML);
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
function cardResponse(title, subtitle, buttons, text, postback, imageUrl = null) {
	var html = "";

	if (imageUrl) {
		html += "<div class=\"myc-image-response\"><div class=\"wrapper_img\"><img src=\"" + imageUrl + "\"/></div></div>";
	}

	html += "<div class=\"myc-card-title\">" + title + "</div>";

	html +=  (subtitle) ? "<div class=\"myc-card-subtitle\">" + subtitle + "</div>" : '';

	jQuery.each(buttons, function (index, item) {

		// if customPayloadResponse
		if (typeof item.title !== 'undefined') {
			item.text = item.title;
			item.postback = item.payload;
		}

		html += "<input type=\"button\" onclick=\"sendQuery('" + item.postback + "')\" class=\"myc-quick-reply\" value=\"" + item.text + "\" />";
	});

	jQuery("#myc-conversation-area").append("<div class=\"myc-conversation-bubble-container myc-conversation-bubble-container-response\">" +
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
	jQuery("#myc-conversation-area").append(innerHTML);

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
		jQuery("#myc-conversation-area").append(innerHTML);
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
function customPayloadResponse(element) {

	jQuery.each(element, function (index, item) {
		cardResponse(item.title, item.subtitle, item.buttons, null, null, item.image_url)
	});
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
