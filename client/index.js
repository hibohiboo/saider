var $ = require("jquery");
jQuery = $;
require("bootstrap");

var io = require("socket.io-client");

require("../node_modules/bootstrap/dist/css/bootstrap.css");
require("./style.css");

var socketio = io.connect(window.location.host);
var user_name = 'ななし';
var memo_data = {};
var room_id = document.getElementById('room').getAttribute('room-id');
var is_need_password = document.getElementById('room').getAttribute('is-need-password');

function joinRoom(user) {
  socketio.emit("connected", user);
}

function deleteRoom() {
  socketio.emit("delete-room");
}

function roomDeleted() {
  socketio.disconnect();
  $('#modal-deleted').modal('show');
}

function escapeHTML(str) {
  str = str.replace(/&/g, '&amp;')
           .replace(/</g, '&lt;')
           .replace(/>/g, '&gt;')
           .replace(/"/g, '&quot;')
           .replace(/'/g, '&#39;');
  return str;
}

/* User Name */

function changeUserName() {
  var input = document.getElementById('user-name');
  if (user_name == input.value) {
    return;
  }

  user_name = input.value;
  $('#changed').show();
  $('#changed').delay(1500).fadeOut();
  socketio.emit("user-name", input.value);
}

/* Dice */

function rollDice() {
  var diceInput = document.getElementById('dice-input');
  var expr = diceInput.value;

  diceInput.value = '';
  socketio.emit("roll", expr);
}

function addResult(result) {
  var result_area = document.getElementById('result-area');

  var div = document.createElement('div');
  var label = document.createElement('label');
  var p = document.createElement('p');

  label.innerText = result.name;
  p.innerText = result.text;

  div.className = "result";
  div.appendChild(label);
  div.appendChild(p);
  result_area.appendChild(div);
}

function addDice(data) {
  var dice_roll = new DiceRoll(data);
}

function initResult(results) {
  for (var result of results) {
    addResult(result);
  }
}

function changeDicebot(dicebot_id) {
  $('#changed-dicebot').show();
  $('#changed-dicebot').delay(1500).fadeOut();
  socketio.emit('dicebot', dicebot_id);
}

function setDicebot(dicebot) {
  document.getElementById('select-room-dicebot').value = dicebot.id;

  var memo = {memo_id: 'dicebot', title: dicebot.name, body: dicebot.description};
  memo_data['dicebot'] = memo;
}
/* Memo */

function addMemo(memo) {
  var memo_area = document.getElementById('memo-area');
  var div = document.createElement('div');

  div.id = 'memo-' + memo.memo_id;
  div.className = 'memo';
  div.setAttribute('memo-id', memo.memo_id);
  div.setAttribute('data-container', 'body');
  div.setAttribute('data-toggle', 'popover');
  div.setAttribute('data-trigger', 'hover');
  div.innerText = memo.title;

  div.onclick = function() {
    showMemoModal(this);
  };
  $(div).popover();

  memo_area.appendChild(div);

  memo_data[memo.memo_id] = memo;
}

function initMemo(memos) {
  for (id in memos) {
    addMemo(memos[id]);
  }
}

function updateMemo(memo) {
  var div = document.getElementById('memo-' + memo.memo_id);
  div.innerText = memo.title;

  memo_data[memo.memo_id] = memo;
}

function removeMemo(memo_id) {
  $('#memo-' + memo_id).remove();
  delete memo_data[memo_id];
}

function showMemoModal(memo_div) {
  $('.popover').popover('hide');
  var memo_modal = document.getElementById('modal-memo');
  var input_memo_title = document.getElementById('memo-title');
  var input_memo_body = document.getElementById('memo-body');

  if (memo_div === undefined) {
    memo_modal.setAttribute('memo-id', 0);
    input_memo_title.value = "";
    input_memo_body.value = "";
    $('#btn-memo-delete').hide();
  }
  else {
    var memo_id = memo_div.getAttribute('memo-id');
    memo_modal.setAttribute('memo-id', memo_id);
    input_memo_title.value = memo_data[memo_id].title;
    input_memo_body.value = memo_data[memo_id].body;
    $('#btn-memo-delete').show();
  }
  $('#modal-memo').modal('show');
}

function sendMemo() {
  var modal = document.getElementById('modal-memo');
  var input_memo_title = document.getElementById('memo-title');
  var input_memo_body = document.getElementById('memo-body');

  var memo_id = modal.getAttribute('memo-id');
  if (memo_id == 0) {
    socketio.emit("memo", {title: input_memo_title.value, body: input_memo_body.value});
  }
  else {
    socketio.emit("update-memo", {memo_id: memo_id, title: input_memo_title.value, body: input_memo_body.value});
  }
  $('#modal-memo').modal('hide');
}

function deleteMemo() {
  var modal = document.getElementById('modal-memo');
  var memo_id = modal.getAttribute('memo-id');
  socketio.emit("delete-memo", memo_id);
  $('#modal-memo').modal('hide');
}

$(function () {
  $('[data-toggle="popover"]').popover();
})

/* Map */

function changeMap(map) {
  var img = document.getElementById('map-img');
  img.onload = function() {
    initDragArea(img.width, img.height);
    repositionAllPieces();
  }
  img.src = map.url;
}

function showMapModal() {
  var input_map_url = document.getElementById('map-url');
  var map_img = document.getElementById('map-img');

  input_map_url.value = map_img.src;
  $('#modal-map').modal('show');
}

function sendMapUrl() {
  var input_map_url = document.getElementById('map-url');

  socketio.emit("map", {url: input_map_url.value});
  $('#modal-map').modal('hide');
}

/* piece */

function initPiece(pieces) {
  for (id in pieces) {
    // console.log(pieces[id])
    addPiece(pieces[id], true);
  }
}

function initDragArea(width, height) {
  var drag_area = document.getElementById('piece-area');
  drag_area.style.width = width;
  drag_area.style.height = height;
}

function addPiece(request, isInit) {
  // console.log(request);
  var piece = document.createElement('img');
  piece.className = 'piece';

  piece.addEventListener('dragstart', function(event) {
    event.dataTransfer.setData('Text', event.target.id);
    console.log('Drag start');
  }, true);
  var img = document.getElementById('map-img');
  piece.id = request.piece_id;
  piece.dataset.x = request.x;
  piece.dataset.y = request.y;
  // console.log(img.width);
  if (isInit) {
    piece.style.left = '-100px';
    piece.style.top = '-100px';
  }
  else {
    piece.style.left = (piece.dataset.x * img.width - 25)+'px';
    piece.style.top = (piece.dataset.y * img.height - 25)+'px';
  }
  piece.src = request.url;
  // console.log('piece');
  // console.log(request.url);

  var map = document.getElementById('piece-area');
  map.appendChild(piece);


  var li = document.createElement('li');
  var simg = document.createElement('img');
  var span = document.createElement('span');
  li.id = 'list-' + request.piece_id;
  simg.src = request.url;
  span.className = 'glyphicon glyphicon-trash';
  span.setAttribute('aria-hidden', true);
  span.onclick = function() {
    socketio.emit('delete-piece', request.piece_id);
  };
  li.appendChild(simg);
  li.appendChild(span);

  var list = document.getElementById('piece-list');
  list.appendChild(li);
}

function deletePiece(id) {
  var piece = document.getElementById(id);
  var element = document.getElementById('list-' + id);
  piece.parentNode.removeChild(piece);
  element.parentNode.removeChild(element);
}

function movePiece(request) {
  var piece = document.getElementById(request.piece_id);
  // console.log(request.piece_id);
  var img = document.getElementById('map-img');

  piece.dataset.x = request.x;
  piece.dataset.y = request.y;
  reposition(piece, img.width, img.height);
}

function reposition(piece, img_width, img_height) {
  piece.style.left = (piece.dataset.x * img_width - 25)+'px';
  piece.style.top = (piece.dataset.y * img_height - 25)+'px';
}

function sendPiece() {
  var input_piece_url = document.getElementById('piece-url');
  // console.log(input_piece_url.value);

  socketio.emit("add-piece", input_piece_url.value);
  $('#modal-piece').modal('hide');
}

function showPieceModal() {
  $('#modal-piece').modal('show');
}

var droparea = document.getElementById('piece-area');
// var droparea = document.getElementById('map-area');

  // var droparea = document.getElementById('droparea');
  // dragoverイベントのリスナーを設定
droparea.addEventListener('dragover', function(evt) {
  evt.preventDefault();
}, true);

function repositionAllPieces() {
  var img = document.getElementById('map-img');
  initDragArea(img.width, img.height);
  var pieces = $('.piece');
  $.each(pieces, function(index, piece) {
    reposition(piece, img.width, img.height);
  });
}

// document.getElementById('map-img').onload = repositionAllPieces;
window.onresize = repositionAllPieces;
// window.onload = repositionAllPieces;
// $(window).load(function(){
//   repositionAllPieces();
// });

// dropイベントのリスナーを設定
droparea.addEventListener('drop', function(evt) {
  // console.log(evt);
  var id = evt.dataTransfer.getData('Text');
  var target = document.getElementById(id);
  // dropイベントが発生したクライアント上のX、Y座標に、ドロップ要素を配置
  target.style.left = (evt.layerX - 25)+'px';
  target.style.top = (evt.layerY - 25)+'px';

  var img = document.getElementById('map-img');
  // console.log(evt.layerX / img.width);
  // console.log(evt.layerY / img.height);

  target.dataset.x = evt.layerX / img.width;
  target.dataset.y = evt.layerY / img.height;
  socketio.emit('move-piece', {piece_id: target.id, url: target.src, x: target.dataset.x, y: target.dataset.y})
  droparea.appendChild(target);
  evt.preventDefault();
}, true);

/* socketio listener */

// socketio.on("connected",  function() {});
socketio.on("init-result",  initResult);
socketio.on("roll",         addDice);
socketio.on("dicebot",      setDicebot);
socketio.on("init-memo",    initMemo);
socketio.on("memo",         addMemo);
socketio.on("update-memo",  updateMemo);
socketio.on("remove-memo",  removeMemo);
socketio.on("map",          changeMap);
socketio.on("init-piece",   initPiece);
socketio.on("add-piece",    addPiece);
socketio.on("delete-piece", deletePiece);
socketio.on("move-piece",   movePiece);
socketio.on("room-deleted", roomDeleted);
socketio.on("accepted", function () {$('#modal-login').modal('hide');});
socketio.on("rejected", function () {
  $('#password-input-group').addClass('has-error');
  $('#error-password').show();
  $('#error-password').delay(1500).fadeOut();
});
// socketio.on("disconnect", function() {});

/* Override Bootstrap */

$.fn.popover.Constructor.prototype.getContent = function () {
  var $e = this.$element
  var o  = this.options

  var content = memo_data[$e.attr('memo-id')].body
  return escapeHTML(content).replace(/\n/g, '<br />')
}

$.fn.popover.Constructor.prototype.setContent = function () {
  var $tip    = this.tip()
  var content = this.getContent()

  $tip.find('.popover-content').children().detach().end()[
    'html'
  ](content)

  $tip.removeClass('fade top bottom left right in')

  // IE8 doesn't accept hiding via the `:empty` pseudo selector, we have to do
  // this manually by checking the contents.
  if (!$tip.find('.popover-title').html()) $tip.find('.popover-title').hide()
}

/* init */

document.getElementById('form-user-name').onsubmit = function () {
  $('#user-name').blur();
  return false;
};

document.getElementById('form-dice').onsubmit = function () {
  rollDice();
  return false;
};

document.getElementById('add-memo').onclick = function () {
  showMemoModal();
};

document.getElementById('form-memo').onsubmit = function () {
  sendMemo();
  return false;
};

document.getElementById('form-map').onsubmit = function () {
  sendMapUrl();
  return false;
};

document.getElementById('new-piece').onsubmit = function () {
  sendPiece();
  return false;
};

document.getElementById('form-login').onsubmit = function () {
  var password = document.getElementById('password').value;
  joinRoom({name: 'ななし', room: room_id, password: password});
  return false;
}

document.getElementById('select-room-dicebot').onchange = function() {
  changeDicebot(this.value);
}

document.getElementById('user-name').onblur = changeUserName;
document.getElementById('change-map').onclick = showMapModal;
document.getElementById('edit-piece').onclick = showPieceModal;
document.getElementById('btn-memo-delete').onclick = deleteMemo;
document.getElementById('btn-delete-room').onclick = deleteRoom;

if (is_need_password == 1) {
  $('#modal-login').modal('show');
  document.getElementById('password').focus();
}
else {
  joinRoom({name: 'ななし', room: room_id});
}

$('#dice-input').popover();
