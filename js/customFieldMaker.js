var $type, $formTmp, $canvas, $form, $addType, $addTmp, $submitBtn, $clearBtn, $clearDataBtn, $groupCreateBtn, $pushBtn, $groupClearBtn, $srcBtn, $groupBtn;

//ローカルストレージに保存
var setData = function(key,value){
	localStorage.setItem(key, value);
}

//ローカルストレージから抽出
var getData = function(key){
	return localStorage.getItem(key) || '';
}

//ローカルストレージから削除
var removeData = function(key){
	localStorage.removeItem(key);
}

//フォームテンプレート取得
var addForm = function(){
	var tmpID = this.value;
	var formTmp = (!tmpID) ? '' : document.getElementById(tmpID+'Form').text ;
	$formTmp.innerHTML = formTmp;
	if(tmpID == 'group'){
		$srcBtn.style.display = 'none';
		$groupBtn.style.display = 'block';
		$addType = document.getElementById('addType');
		$addTmp = document.getElementById('addTmp');
		$addType.addEventListener('change',addGroupForm,false);
	}else{
		$srcBtn.style.display = 'block';
		$groupBtn.style.display = 'none';
	}
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

//グループのフォーム追加
var addGroupForm = function(){
	var tmpID = this.value;
	var formTmp = (!tmpID) ? '' : document.getElementById(tmpID+'Form').text ;
	$addTmp.innerHTML = formTmp;
}


// 画面に追加
var addItem = function(html) {
	var html = document.createTextNode(html);
	$canvas[0].appendChild(html);
	$canvas[0].style.display = 'block';
	prettyPrint();
}

//ソース生成
var createSrc = function(e){	
	clearSrc();
	var data = createData();
	
	var type,flag = false;
	if(e.target.id == 'push'){
		type = data.addType+'Group';
	}else{
		type = data.type;
		flag = true;
	}
	
	var html = createTmp(data,type);
	
	if(flag){
		var defHtml = getData('cfm@defHtml');
		html = defHtml + html;
		setData('cfm@defHtml',html);
		
		addItem(html);
	}else{
		var index = 0;
		for(key in localStorage){
			if(key.indexOf('cfm@group') > -1) index++;
		}
		setData('cfm@group#'+data.name+':'+data.title+'['+index+']',html);
		createGroup();
	}
	e.preventDefault();
}

//グループ生成
var createGroup = function(){
	clearSrc();
	var nameList = [];
	var titleList = [];
	var loopField = [];
	var tmpField = [];
	var varTmp = [];
	for(key in localStorage){
		var _key = key.match(/cfm@group#(\w+?):(.+?)\[(\d+)\]/);
		if(!_key) continue;
		var index = _key[3];
		nameList[index] = _key[1];
		titleList[index] = _key[2];
		loopField[index] = getData(key).replace(/<!-- BEGIN (\w+):tmp -->(([\n\r\t]|.)*?)<!-- END (\w+):tmp -->/g,function(m,key,val){
			varTmp[index] = val;
			return '';
		});
		tmpField[index] = loopField[index].replace(/\{(.|:|#)+?\}/g,'');
		tmpField[index] = tmpField[index].replace(/<!-- BEGIN (\w+):veil -->(([\n\r\t]|.)*?)<!-- END (\w+):veil -->/g,'');
	}
	
	var data = createData();
	data['name'] = [];
	data['title'] = [];
	data['loopField'] = '';
	data['tmpField'] = '';
	data['varTmp'] = '';
	for(var i=0;i<nameList.length;i++){
		data['name'].push(nameList[i]);
		data['title'].push(titleList[i]);
		data['loopField'] += loopField[i];
		data['tmpField'] += tmpField[i];
		data['varTmp'] += varTmp[i].replace(/{#(\w+)}/g, function(m, key) {
			var text = data[key] || m;
			return text;
		});
	}
	
	var html = createTmp(data,'group');
	addItem(html);
}

//フォームのデータを取得
var createData = function(){
	var data = {};
	var j = 0;
	for(var i=0;i<$form.length;i++){
		var key = $form[i].name;
		var type = $form[i].type;
		if(type == 'checkbox' || type == 'radio'){
			if(!$form[i].checked) continue;
			if(type == 'checkbox' && key.indexOf('[]') > -1){
				var _key = key.replace(/\[\]/,'');
				if(!data[_key]) data[_key] = [];
				data[_key].push($form[i].value);
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
	return data;
}

//テンプレート作成
var createTmp = function(data,tmpType) {
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
				var text = (typeof data[key][i] != 'string') ? data[key][i][key2] || m : data[key2][i] || m ;
				return text;
			});
		}
		return reTmp;
	});
	
	var html = template.replace(/{#(\w+)}/g, function(m, key) {
		var text = data[key] || m;
		return text;
	});
	
	html = html.replace(/\\/g,'');
	
	return html;
}

//クリア
var clearSrc = function(){
	$canvas[0].innerHTML = '';
	$canvas[0].style.display = 'none';
}

//履歴もクリア  
var clearData = function(){
	clearSrc();
	removeData('cfm@defHtml');
}

//グループクリア
var clearGroup = function(e){
	clearSrc();
	for(key in localStorage){
		if(key.indexOf('cfm@group') > -1){
			removeData(key);
		}
	}
}

window.onload = function(){
	$type = document.getElementById('typeSelect');
	$formTmp = document.getElementById('formTmp');
	$canvas = document.getElementById('codearea');
	$canvas = $canvas.getElementsByTagName('pre');
	$form = document.getElementById('form');
	$submitBtn = document.getElementById('submit');
	$clearBtn = document.getElementById('clear');
	$clearDataBtn = document.getElementById('clearData');
	$groupCreateBtn = document.getElementById('groupCreate');
	$pushBtn = document.getElementById('push');
	$groupClearBtn = document.getElementById('groupClear');
	$srcBtn = document.getElementById('srcBtn');
	$groupBtn = document.getElementById('groupBtn');
	
	$('.addBtn').live('click',function(e){
		addElem(e,this);
	});
	
	$('.delBtn').live('click',function(e){
		delElem(e,this);
	});
	
	$type.addEventListener('change',addForm,false);
	$form.addEventListener('submit',createSrc,false);
	$groupCreateBtn.addEventListener('click',createGroup,false);
	$pushBtn.addEventListener('click',createSrc,false);
	
	$clearBtn.addEventListener('click',clearSrc,false);
	$clearDataBtn.addEventListener('click',clearData,false);
	$groupClearBtn.addEventListener('click',clearGroup,false);
	
	if(html = getData('cfm@defHtml')) addItem(html);
}
