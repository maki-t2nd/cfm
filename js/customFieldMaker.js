var $type, $formTmp, $canvas, $form, $submitBtn, $clearBtn;

//フォームテンプレート取得
var addForm = function(){
	clearSrc();
	var tmpID = this.value;
	var formTmp = (!tmpID) ? '' : document.getElementById(tmpID+'Form').text ;
	$formTmp.innerHTML = formTmp;
	
}

//要素追加
var addElem = function(e, elem){
	var $prev = elem.previousSibling;
	while($prev.nodeType !== 1){
		$prev = $prev.previousSibling;
	}
	var $clone = $prev.cloneNode(true);
	elem.parentNode.insertBefore($clone,elem);
	e.preventDefault();
}

//要素削除
var delElem = function(e,elem){
	var delElem = elem.parentNode;
	var parent = delElem.parentNode;
	var nodeCont = 0;
	for(var i=0;i<parent.childNodes.length;i++){
		if(parent.childNodes[i].nodeType == 1) nodeCont++;
	}
	
	if(nodeCont > 2) delElem.parentNode.removeChild(delElem);
	e.preventDefault();
}

var addItem = function(data,tmpType) {
	// テンプレート取得
	var template = document.getElementById(tmpType).text;
	
	// テンプレートからHTML作成
	var rgVeil = /<!-- BEGIN (\w+):veil -->(([\n\r\t]|.)*?)<!-- END (\w+):veil -->/g;
	template = template.replace(rgVeil,function(m,key,val){
		return (!data[key]) ? '' : val ;
	});
	
	var rgLoop = /<!-- BEGIN (\w+):loop -->(([\n\r\t]|.)*?)<!-- END (\w+):loop -->/g;
	template = template.replace(rgLoop,function(m,key,val){
		var defTmp = val;
		var reTmp = '';
		for(var i=0;i<data[key].length;i++){
			reTmp += defTmp.replace(/{#(\w+)}/g, function(m, key2){
				var text = data[key][i][key2] || m;
				return text;
			});
		}
		return reTmp;
	});
	
	var rgLoop2 = /<!-- BEGIN (\w+\[\]):loop -->(([\n\r\t]|.)*?)<!-- END (\w+\[\]):loop -->/g;
	template = template.replace(rgLoop2,function(m,key,val){
		var defTmp = val;
		var reTmp = '';
		for(var i=0;i<data[key].length;i++){
			reTmp += defTmp.replace(/{#(\w+\[\])}/g, function(m,key2){
				var text = data[key2][i] || m;
				return text;
			});
		}
		return reTmp;
	});
	
	var html = template.replace(/{#(\w+)}/g, function(m, key) {
		var text = data[key] || '';
		return text;
	});
	
	// 画面に追加
	html = document.createTextNode(html);
	$canvas[0].appendChild(html);
	$canvas[0].style.display = 'block';
	prettyPrint();
}

//フォームのデータを取得
var createData = function(e){
	clearSrc();
	var data = {};
	var j = 0;
	for(var i=0;i<$form.length;i++){
		var key = $form[i].name;
		var type = $form[i].type;
		if(type == 'checkbox' || type == 'radio'){
			if(!$form[i].checked) continue;
			if(type == 'checkbox' && key.indexOf('[]') > -1){
				//key = key.replace(/\[\]/,'');
				if(!data[key]) data[key] = [];
				data[key].push($form[i].value);
				continue;
			}
		}
		if(key.indexOf('_') > -1){
			var _key = key.replace(/_.+$/,'');
			if(!data[_key]) data[_key] = [];
			if(!data[_key][j]) data[_key][j] = {};
			if(!!data[_key][j][key]){
				j++;
				if(typeof data[_key][j] != 'object') data[_key][j] = {};
			}
			data[_key][j][key] = $form[i].value;
		}else{
			data[key] = $form[i].value;
		}
	}
	
	addItem(data,data.type);
	e.preventDefault();
}

//クリア
var clearSrc = function(){
	$canvas[0].innerHTML = '';
	$canvas[0].style.display = 'none';
}

window.onload = function(){
	$type = document.getElementById('typeSelect');
	$formTmp = document.getElementById('formTmp');
	$canvas = document.getElementById('codearea');
	$canvas = $canvas.getElementsByTagName('pre');
	$form = document.getElementById('form');
	$submitBtn = document.getElementById('submit');
	$clearBtn = document.getElementById('clear');
	$('.addBtn').live('click',function(e){
		addElem(e,this);
	});
	
	$('.delBtn').live('click',function(e){
		delElem(e,this);
	});
	
	$type.addEventListener('change',addForm,false);
	$form.addEventListener('submit',createData,false);
	
	$clearBtn.addEventListener('click',clearSrc,false);
}
