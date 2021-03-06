var socket = io();
var canVuileFrits = true;
var started = false;
var timeOutId = false;
var localAchievements = [];
var showingAchievements = false;
var playerNamesShown = false;

var lastDeck, lastCards, lastPiles, lastFrits, lastLastmove;

socket.on("update cards", function(cards, deck, piles, frits, lastmove, result, timeout, achievements) {
	if(result && result.name === "Reconnected"){
		startGame();
		$("#queue-image").show();
		$("#rules-image").show();
		socket.emit("playerNames")
		$('#timeout-container').hide();
	}
	
	// Save state to be able to redraw cards when you click the flag
	lastDeck = deck;
	lastCards = cards;
	lastPiles = piles;
	lastFrits = frits;
	lastLastmove = lastmove;

	showDeck(deck);
	showHand(cards);
	showPiles(piles, frits, lastmove);
	
	if (achievements && achievements.length > 0) {
		achievements.forEach((achievement) => {
			localAchievements.push(achievement);
		})

		showAchievement();
	}

	if(result){
		var to = timeout > 0 ? timeout : result.timeout
		queueMessage(result.description, to);

		if(result.value !== 0){
			$("#vuilefrits").hide();

			if(result.name === "Baudet"){
				$('#turn').text("Baudet");
			} else {		
				$('#turn').text("");		
			}
		}
		
		if(result.name === "Disconnect"){
				showTimeout(timeout, "Reconnecting...");
		} else if (result.timeout > 0 && (!achievements || achievements.length === 0)) {
			showTimeout(result.timeout, "Fritspauze");				
		}
		
		// Vibrate when a card is played
		if (window && window.navigator && typeof window.navigator.vibrate === 'function') {
			window.navigator.vibrate(100);
		}		
	}
});

socket.on("queue", function(players) {
	var queue = $("#players");
	queue.empty();
	for(var i = 0; i < players.length; i++){
		var player = players[i];


		var p = $("<div>").text('> '+player.name);
		if(player.id == socket.id){
			p.addClass('ownname');
			
			if(i == 0)
				$('#newgame').show();
			else
				$('#newgame').hide();
				
		}
		queue.append(p);
	}
});

socket.on("match started", function() {
	canVuileFrits = true;
	queueMessage('Iedereen mag nu vuile fritsen',9000)
	startGame();
	$("#queue-image").show();
	$("#rules-image").show();
	$("#lang-flag").show()

	setTimeout(() => {
		socket.emit("playerNames")
	}, 10000)	
});

socket.on("game over", function(name) {
	queueMessage(name + " heeft verloren en moet 2 fritsjes nemen")
	setTimeout(function(){ resetGame(); }, 10000);
});

socket.on("playerNames", function(names) {
	var timeout = 10000;
	queueMessage(names.join(' ➡️ '), timeout);

	setTimeout(() => {
		playerNamesShown = false;
	}, timeout);
});

function resetGame(){
	$("#lang-flag").hide()
	$("#queue-image").hide();
	$("#rules-image").hide();
	$("#hand").empty();
	$("#deck").empty();
	$("#piles").empty();
	joinQueue();
}

//////////  Functions
function enterQueue(name){
	socket.emit("joinQueue", name);
}

function frits() {
	socket.emit("frits");
}

function vuileFrits() {
	if(canVuileFrits){
		socket.emit("vuileFrits");
		$('#vuilefrits').addClass('wait');
		canVuileFrits = false;
		setTimeout(function(){ 
			$('#vuilefrits').removeClass('wait'); 
			canVuileFrits = true;
		}, 2000);
	}
}

function startMatch() {
	socket.emit("startMatch");
}

function getPlayerNames() {
	if (playerNamesShown) {
		return;
	}

	playerNamesShown = true;
	socket.emit("getPlayerNames")
}

function openRulePDF(url) {
	var win = window.open('https://fritsen.app', '_blank');
	win.focus();
  }

function queueMessage(msg, timeout){
	if (!msg) {
		return
	}

	var notifications = $('#notifications-container');
	var notification = $("<div>").addClass('notification')
	var message = $("<div>").addClass('notification-text').text(msg);
	var counter = $("<div>").addClass('notification-count');

	notifications.append(notification)
	notification.append(message)
	notification.append(counter)

	var showNext = function(count) {
		if (count === 0) {
			notification.fadeOut()
			return;
		}

		counter.text(count);

		setTimeout(function(){
			showNext(count - 1)
		}, 1000);
	}

	notification.fadeIn();

	timeout = timeout > 5000 ? timeout : 5000;
	showNext(Math.floor(timeout/1000));	
}

function playCard(card, pile) {	
	var cardNum = parseInt(card.replace(/\D/g,''));
	var pileNum = parseInt(pile.replace(/\D/g,''));
	if (Number.isInteger(cardNum) && Number.isInteger(pileNum)) {
		socket.emit("playCard", cardNum, pileNum);
	}
}

function showAchievement() {
	if (!showingAchievements && localAchievements.length > 0) {
		var achievement = localAchievements.shift();

		$('#achievement-by').text(achievement.by);
		$('#achievement-text').text(achievement.text);
		$('#achievement-container').fadeIn();

		var audioElements = $("#achievement-sounds > audio")
		var random = Math.floor(Math.random() * audioElements.length)
		audioElements[random].play()

		setTimeout(function(){ 
			$('#achievement-container').fadeOut(500, () => {
				showingAchievements = false;
				showAchievement()
			})
		}, 2500);
	} 
}

function showTimeout(timeout, message) {
	$('#timeout-text').text(message);
	$('#timeout-container').fadeIn();

	setTimeout(function(){ 
		$('#timeout-container').fadeOut(500, () => {})
	}, timeout);
}

function switchLanguage(){
	var flag = $('#lang-flag');
	if (flag.hasClass('nl')) {
		flag.removeClass('nl')
		flag.addClass('fr')
	} else {
		flag.removeClass('fr')
		flag.addClass('nl')
	}
  
	if (lastDeck) {
		showDeck(lastDeck);
		showHand(lastCards);
		showPiles(lastPiles, lastFrits, lastLastmove);
	}
}
