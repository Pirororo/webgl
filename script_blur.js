// ブラーフィルターによるぼかし
//
// プログラムオブジェクトは２個つくる（blur版もつくる）
// attributeもuniformも２個つくる（blur版もつくる）
// プログラムオブジェクトの有効化(シェーダの切り替え)
//   gl.useProgram(prg);
// プログラムオブジェクトの有効化(シェーダの切り替え)
//   gl.useProgram(bPrg);
// ブラーフィルターをかけるかどうかの真偽値
//   var useBlur = eBlur.checked;
// ブラーでは作ったtextureをuniformでおくる！！（bindTexture忘れない！）
// ブラーでは正射投影にする！！

//以下３つのwidthとheightは揃える！！
// // canvasエレメントを取得
// // フレームバッファーオブジェクト
// // htmlのshederのtFrag(0~1にいれるための補正用変数)

//html
//　gl_FragCoordは左下を原点としてwidthとheightの大きさ
//destColorはブラーの濃さ

//繰り返さないようにこの２行も指定する　
//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);





// canvas とクォータニオンをグローバルに扱う
var c;
var q = new qtnIV();
var qt = q.identity(q.create());

// マウスムーブイベントに登録する処理
function mouseMove(e){
	var cw = c.width;
	var ch = c.height;
	var wh = 1 / Math.sqrt(cw * cw + ch * ch);
	var x = e.clientX - c.offsetLeft - cw * 0.5;
	var y = e.clientY - c.offsetTop - ch * 0.5;
	var sq = Math.sqrt(x * x + y * y);
	var r = sq * 2.0 * Math.PI * wh;
	if(sq != 1){
		sq = 1 / sq;
		x *= sq;
		y *= sq;
	}
	q.rotate(r, [y, x, 0.0], qt);
}

onload = function(){
	// canvasエレメントを取得
	c = document.getElementById('canvas');
	c.width = 256;
	c.height = 256;
	
	// イベント処理
	c.addEventListener('mousemove', mouseMove, true);
	
	// webglコンテキストを取得
    var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    
    // エレメントへの参照を取得
    var eBlur = document.getElementById('blur');
    
    // フレームバッファ用シェーダ-start----------------------------------------
	
	// 頂点シェーダとフラグメントシェーダの生成
	var v_shader = create_shader('vs');
	var f_shader = create_shader('fs');
	
	// プログラムオブジェクトの生成とリンク
	var prg = create_program(v_shader, f_shader);
	
	// attributeLocationを配列に取得
	var attLocation = new Array();
	attLocation[0] = gl.getAttribLocation(prg, 'position');
	attLocation[1] = gl.getAttribLocation(prg, 'normal');
	attLocation[2] = gl.getAttribLocation(prg, 'color');
	attLocation[3] = gl.getAttribLocation(prg, 'textureCoord');
	
	// attributeの要素数を配列に格納
	var attStride = new Array();
	attStride[0] = 3;
	attStride[1] = 3;
	attStride[2] = 4;
	attStride[3] = 2;
	

    // VBOとIBOの生成
	// 球体モデル
	var earthData     = sphere(64, 64, 1.0, [1.0, 1.0, 1.0, 1.0]);
	var ePosition     = create_vbo(earthData.p);
	var eNormal       = create_vbo(earthData.n);
	var eColor        = create_vbo(earthData.c);
	var eTextureCoord = create_vbo(earthData.t);
	var eVBOList      = [ePosition, eNormal, eColor, eTextureCoord];
	var eIndex        = create_ibo(earthData.i);
    
	// uniformLocationを配列に取得
	var uniLocation = new Array();
    uniLocation[0]  = gl.getUniformLocation(prg, 'mMatrix');
    uniLocation[1]  = gl.getUniformLocation(prg, 'mvpMatrix');
	uniLocation[2]  = gl.getUniformLocation(prg, 'invMatrix');
    uniLocation[3]  = gl.getUniformLocation(prg, 'lightDirection');
    uniLocation[4] = gl.getUniformLocation(prg, 'useLight');//bool
    uniLocation[5]  = gl.getUniformLocation(prg, 'texture');
    
    // フレームバッファ用-end--------------------------------------------------

    // ブラー用シェーダ-start----------------------------------------

    // 頂点シェーダとフラグメントシェーダの生成
	var v_shader = create_shader('bvs');
	var f_shader = create_shader('bfs');
	
	// プログラムオブジェクトの生成とリンク
	var bPrg = create_program(v_shader, f_shader);
	
	// attributeLocationを配列に取得
	var bAttLocation = new Array();
	bAttLocation[0] = gl.getAttribLocation(bPrg, 'position');
	bAttLocation[1] = gl.getAttribLocation(bPrg, 'color');
	
	// attributeの要素数を配列に格納
	var bAttStride = new Array();
	bAttStride[0] = 3;
	bAttStride[1] = 4;
	

    // VBOとIBOの生成
    // 平面
    // 頂点の位置
	var position = [
		-1.0,  1.0,  0.0,
		 1.0,  1.0,  0.0,
		-1.0, -1.0,  0.0,
		 1.0, -1.0,  0.0
	];
	
	// 頂点色
	var color = [
		1.0, 1.0, 1.0, 1.0,
		1.0, 1.0, 1.0, 1.0,
		1.0, 1.0, 1.0, 1.0,
		1.0, 1.0, 1.0, 1.0
	];
	
	// 頂点インデックス
	var index = [
		0, 1, 2,
		3, 2, 1
	];
	
	var vPosition     = create_vbo(position);
	var vColor        = create_vbo(color);
	var vVBOList      = [vPosition, vColor];
	var vIndex        = create_ibo(index);
    
	// uniformLocationを配列に取得
	var bUniLocation = new Array();
    bUniLocation[0]  = gl.getUniformLocation(bPrg, 'mvpMatrix');
    bUniLocation[1]  = gl.getUniformLocation(bPrg, 'texture');//textureを送ってあげるのを忘れないように！！！
    bUniLocation[2] = gl.getUniformLocation(bPrg, 'useBlur');//bool


    // ブラー用-end--------------------------------------------------

    var m = new matIV();
	var mMatrix   = m.identity(m.create());
	var vMatrix   = m.identity(m.create());
	var pMatrix   = m.identity(m.create());
	var tmpMatrix = m.identity(m.create());
	var mvpMatrix = m.identity(m.create());
	var invMatrix = m.identity(m.create());

	// 各種フラグを有効にする
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	
	// テクスチャ用変数の宣言と生成
    var texture0 = null;
    var texture1 = null;
    create_texture('data/texture0.png', 0);
    create_texture('texture.png', 1);
    gl.activeTexture(gl.TEXTURE0);

    //フレームバッファーオブジェクト
    var fBufferWidth = 512;
    var fBufferHeight = 512;
    var fBuffer = create_framebuffer(fBufferWidth, fBufferHeight);


    //カウンタの宣言
    var count = 0;


    // 恒常ループ
	(function(){

        // カウンタをインクリメントする
        count++;

        // カウンタを元にラジアンを算出
		var rad  = (count % 360) * Math.PI / 180;

        // フレームバッファをバインド
        gl.bindFramebuffer(gl.FRAMEBUFFER, fBuffer.f);

        // フレームバッファを初期化
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // プログラムオブジェクトの有効化(シェーダの切り替え)
		gl.useProgram(prg);

        //地球用のIBOとVBOをセット
        set_attribute(eVBOList, attLocation, attStride);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eIndex);
        
        // ライト関連
        var lightDirection = [-1.0, 2.0, 1.0];
        
        // ビュー×プロジェクション座標変換行列
		m.lookAt([0.0, 0.0, 5.0], [0, 0, 0], [0, 1, 0], vMatrix);
        // m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
        m.perspective(45, fBufferWidth / fBufferHeight, 0.1, 100, pMatrix);//ここはハッファーのwidth, heightにする！！！！！！！
        m.multiply(pMatrix, vMatrix, tmpMatrix);
        
        // 背景用球体をフレームバッファにレンダリング
		gl.bindTexture(gl.TEXTURE_2D, texture1);
		m.identity(mMatrix);
		m.scale(mMatrix, [50.0, 50.0, 50.0], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		m.inverse(mMatrix, invMatrix);
		gl.uniformMatrix4fv(uniLocation[0], false, mMatrix);
		gl.uniformMatrix4fv(uniLocation[1], false, mvpMatrix);
		gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
		gl.uniform3fv(uniLocation[3], lightDirection);
		gl.uniform1i(uniLocation[4], false);//bool
		gl.uniform1i(uniLocation[5], 0);
        gl.drawElements(gl.TRIANGLES, earthData.i.length, gl.UNSIGNED_SHORT, 0);

        // 地球本体をフレームバッファにレンダリング
		gl.bindTexture(gl.TEXTURE_2D, texture0);
		m.identity(mMatrix);
		m.rotate(mMatrix, rad, [0, 1, 0], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		m.inverse(mMatrix, invMatrix);
		gl.uniformMatrix4fv(uniLocation[0], false, mMatrix);
		gl.uniformMatrix4fv(uniLocation[1], false, mvpMatrix);
		gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
		gl.uniform1i(uniLocation[4], true);//bool
        gl.drawElements(gl.TRIANGLES, earthData.i.length, gl.UNSIGNED_SHORT, 0);
        
        // フレームバッファのバインドを解除
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);



        //ここからブラー！！！！！
        // canvasを初期化
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // プログラムオブジェクトの有効化(シェーダの切り替え)
		gl.useProgram(bPrg);
		
		// ブラーフィルターをかけるかどうかの真偽値
		var useBlur = eBlur.checked;
        
        // 板ポリゴンのVBOとIBOをセット
		set_attribute(vVBOList, bAttLocation, bAttStride);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vIndex);
        
        // フレームバッファに描き込んだ内容をテクスチャとして適用
		gl.bindTexture(gl.TEXTURE_2D, fBuffer.t);
	
		// ビュー×プロジェクション座標変換行列(正射影)
		m.lookAt([0.0, 0.0, 0.5], [0, 0, 0], [0, 1, 0], vMatrix);
        // m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
        m.ortho(-1.0, 1.0, 1.0, -1.0, 0.1, 1, pMatrix);//正射影 !!!!!!!!
        m.multiply(pMatrix, vMatrix, tmpMatrix);

        // 板ポリゴンをレンダリング
        // モデル座標変換行列の生成
        m.identity(mMatrix);
        m.multiply(tmpMatrix, mMatrix, mvpMatrix);

        // uniform変数の登録と描画
		gl.uniformMatrix4fv(bUniLocation[0], false, mvpMatrix);
        gl.uniform1i(bUniLocation[1], 0);//texture
        gl.uniform1i(bUniLocation[2], useBlur);
        gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);

		
		// コンテキストの再描画
		gl.flush();
		
		// ループのために再帰呼び出し
		setTimeout(arguments.callee, 1000 / 30);
    })();
 


	
	// シェーダを生成する関数
	function create_shader(id){
		// シェーダを格納する変数
		var shader;
		
		// HTMLからscriptタグへの参照を取得
		var scriptElement = document.getElementById(id);
		
		// scriptタグが存在しない場合は抜ける
		if(!scriptElement){return;}
		
		// scriptタグのtype属性をチェック
		switch(scriptElement.type){
			
			// 頂点シェーダの場合
			case 'x-shader/x-vertex':
				shader = gl.createShader(gl.VERTEX_SHADER);
				break;
				
			// フラグメントシェーダの場合
			case 'x-shader/x-fragment':
				shader = gl.createShader(gl.FRAGMENT_SHADER);
				break;
			default :
				return;
		}
		
		// 生成されたシェーダにソースを割り当てる
		gl.shaderSource(shader, scriptElement.text);
		
		// シェーダをコンパイルする
		gl.compileShader(shader);
		
		// シェーダが正しくコンパイルされたかチェック
		if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
			
			// 成功していたらシェーダを返して終了
			return shader;
		}else{
			
			// 失敗していたらエラーログをアラートする
			alert(gl.getShaderInfoLog(shader));
		}
	}
	
	// プログラムオブジェクトを生成しシェーダをリンクする関数
	function create_program(vs, fs){
		// プログラムオブジェクトの生成
		var program = gl.createProgram();
		
		// プログラムオブジェクトにシェーダを割り当てる
		gl.attachShader(program, vs);
		gl.attachShader(program, fs);
		
		// シェーダをリンク
		gl.linkProgram(program);
		
		// シェーダのリンクが正しく行なわれたかチェック
		if(gl.getProgramParameter(program, gl.LINK_STATUS)){
		
			// 成功していたらプログラムオブジェクトを有効にする
			gl.useProgram(program);
			
			// プログラムオブジェクトを返して終了
			return program;
		}else{
			
			// 失敗していたらエラーログをアラートする
			alert(gl.getProgramInfoLog(program));
		}
	}
	
	// VBOを生成する関数
	function create_vbo(data){
		// バッファオブジェクトの生成
		var vbo = gl.createBuffer();
		
		// バッファをバインドする
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		
		// バッファにデータをセット
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
		
		// バッファのバインドを無効化
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		
		// 生成した VBO を返して終了
		return vbo;
	}
	
	// VBOをバインドし登録する関数
	function set_attribute(vbo, attL, attS){
		// 引数として受け取った配列を処理する
		for(var i in vbo){
			// バッファをバインドする
			gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);
			
			// attributeLocationを有効にする
			gl.enableVertexAttribArray(attL[i]);
			
			// attributeLocationを通知し登録する
			gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
		}
	}
	
	// IBOを生成する関数
	function create_ibo(data){
		// バッファオブジェクトの生成
		var ibo = gl.createBuffer();
		
		// バッファをバインドする
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
		
		// バッファにデータをセット
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
		
		// バッファのバインドを無効化
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
		
		// 生成したIBOを返して終了
		return ibo;
    }
    
    // テクスチャを生成する関数
	function create_texture(source, number){
		// イメージオブジェクトの生成
		var img = new Image();
		
		// データのオンロードをトリガーにする
		img.onload = function(){
			// テクスチャオブジェクトの生成
			var tex = gl.createTexture();
			
			// テクスチャをバインドする
			gl.bindTexture(gl.TEXTURE_2D, tex);
			
			// テクスチャへイメージを適用
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
			
			// ミップマップを生成
			gl.generateMipmap(gl.TEXTURE_2D);
			
			// テクスチャパラメータの設定
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
			
			switch(number){
				case 0:
					texture0 = tex;
					break;
				case 1:
					texture1 = tex;
					break;
				default:
					break;
			}
			
			// テクスチャのバインドを無効化
			gl.bindTexture(gl.TEXTURE_2D, null);
		};
		
		// イメージオブジェクトのソースを指定
		img.src = source;
    }
    
    // フレームバッファをオブジェクトとして生成する関数
	function create_framebuffer(width, height){
        //フレームバッファの生成
        var frameBuffer = gl.createFramebuffer();
        //フレームバッファをwebGLにバインド
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);


        //深度バッファ用のレンダーバッファの生成とバインド
        var depthRenderBuffer = gl.createRenderbuffer();
        //深度バッファ用のレンダーバッファをwebGLにバインド
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);
        //レンダーバッファを深度バッファとして設定
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        //フレームバッファにレンダーバッファを関連付ける
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);


        //フレームバッファー用テクスチャの生成
        var fTexture = gl.createTexture();
        // フレームバッファ用のテクスチャをバインド
		gl.bindTexture(gl.TEXTURE_2D, fTexture);
        //フレームバッファー用テクスチャにカラー用のメモリ領域を確保
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        // テクスチャパラメータ
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        // フレームバッファにテクスチャを関連付ける
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);



        // 各種オブジェクトのバインドを解除
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);


        //オブジェクトを返して終了
        return{f: frameBuffer, d : depthRenderBuffer, t : fTexture};
    }

};












// // sample_028
// //
// // WebGLでフレームバッファを使ってブラーフィルター


	
// 	// ブラーフィルター用シェーダ-start----------------------------------------
	
// 	// 頂点シェーダとフラグメントシェーダ、プログラムオブジェクトの生成
// 	v_shader = create_shader('bvs');
// 	f_shader = create_shader('bfs');
// 	var bPrg = create_program(v_shader, f_shader);
	
// 	// attributeLocationを配列に取得
// 	var bAttLocation = new Array();
// 	bAttLocation[0] = gl.getAttribLocation(bPrg, 'position');
// 	bAttLocation[1] = gl.getAttribLocation(bPrg, 'color');
	
// 	// attributeの要素数を配列に格納
// 	var bAttStride = new Array();
// 	bAttStride[0] = 3;
// 	bAttStride[1] = 4;
	
// 	// 頂点の位置
// 	var position = [
// 		-1.0,  1.0,  0.0,
// 		 1.0,  1.0,  0.0,
// 		-1.0, -1.0,  0.0,
// 		 1.0, -1.0,  0.0
// 	];
	
// 	// 頂点色
// 	var color = [
// 		1.0, 1.0, 1.0, 1.0,
// 		1.0, 1.0, 1.0, 1.0,
// 		1.0, 1.0, 1.0, 1.0,
// 		1.0, 1.0, 1.0, 1.0
// 	];
	
// 	// 頂点インデックス
// 	var index = [
// 		0, 1, 2,
// 		3, 2, 1
// 	];
	
// 	// VBOとIBOの生成
// 	var vPosition     = create_vbo(position);
// 	var vColor        = create_vbo(color);
// 	var vVBOList      = [vPosition, vColor];
// 	var vIndex        = create_ibo(index);
	
// 	// uniformLocationを配列に取得
// 	var bUniLocation = new Array();
// 	bUniLocation[0] = gl.getUniformLocation(bPrg, 'mvpMatrix');
// 	bUniLocation[1] = gl.getUniformLocation(bPrg, 'texture');
// 	bUniLocation[2] = gl.getUniformLocation(bPrg, 'useBlur');
	
// 	// ブラーフィルター用-end--------------------------------------------------
	
// 	// 各種行列の生成と初期化
// 	var m = new matIV();
// 	var mMatrix   = m.identity(m.create());
// 	var vMatrix   = m.identity(m.create());
// 	var pMatrix   = m.identity(m.create());
// 	var tmpMatrix = m.identity(m.create());
// 	var mvpMatrix = m.identity(m.create());
// 	var invMatrix = m.identity(m.create());
	
// 	// 深度テストを有効にする
// 	gl.enable(gl.DEPTH_TEST);
// 	gl.depthFunc(gl.LEQUAL);
	
// 	// テクスチャ関連
// 	var texture0 = null;
// 	var texture1 = null;
// 	create_texture('data/texture0.png', 0);
// 	create_texture('texture.png', 1);
// 	gl.activeTexture(gl.TEXTURE0);
	
// 	// フレームバッファオブジェクトの取得
// 	var fBufferWidth  = 256;
// 	var fBufferHeight = 256;
// 	var fBuffer = create_framebuffer(fBufferWidth, fBufferHeight);
		
// 	// カウンタの宣言
// 	var count = 0;
	
// 	// 恒常ループ
// 	(function(){
// 		// カウンタをインクリメントする
// 		count++;
		
// 		// カウンタを元にラジアンを算出
// 		var rad  = (count % 360) * Math.PI / 180;
		
// 		// フレームバッファをバインド
// 		gl.bindFramebuffer(gl.FRAMEBUFFER, fBuffer.f);
		
// 		// フレームバッファを初期化
// 		gl.clearColor(0.0, 0.0, 0.0, 1.0);
// 		gl.clearDepth(1.0);
// 		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
// 		// プログラムオブジェクトの有効化(シェーダの選択)
// 		gl.useProgram(prg);
		
// 		// 地球用のVBOとIBOをセット
// 		set_attribute(eVBOList, attLocation, attStride);
// 		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eIndex);
		
// 		// ライト関連
// 		var lightDirection = [-1.0, 2.0, 1.0];
		
// 		// ビュー×プロジェクション座標変換行列
// 		m.lookAt([0.0, 0.0, 5.0], [0, 0, 0], [0, 1, 0], vMatrix);
// 		m.perspective(45, fBufferWidth / fBufferHeight, 0.1, 100, pMatrix);
// 		m.multiply(pMatrix, vMatrix, tmpMatrix);
		
// 		// 背景用球体をフレームバッファにレンダリング
// 		gl.bindTexture(gl.TEXTURE_2D, texture1);
// 		m.identity(mMatrix);
// 		m.scale(mMatrix, [50.0, 50.0, 50.0], mMatrix);
// 		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
// 		m.inverse(mMatrix, invMatrix);
// 		gl.uniformMatrix4fv(uniLocation[0], false, mMatrix);
// 		gl.uniformMatrix4fv(uniLocation[1], false, mvpMatrix);
// 		gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
// 		gl.uniform3fv(uniLocation[3], lightDirection);
// 		gl.uniform1i(uniLocation[4], false);
// 		gl.uniform1i(uniLocation[5], 0);
// 		gl.drawElements(gl.TRIANGLES, earthData.i.length, gl.UNSIGNED_SHORT, 0);
		
// 		// 地球本体をフレームバッファにレンダリング
// 		gl.bindTexture(gl.TEXTURE_2D, texture0);
// 		m.identity(mMatrix);
// 		m.rotate(mMatrix, rad, [0, 1, 0], mMatrix);
// 		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
// 		m.inverse(mMatrix, invMatrix);
// 		gl.uniformMatrix4fv(uniLocation[0], false, mMatrix);
// 		gl.uniformMatrix4fv(uniLocation[1], false, mvpMatrix);
// 		gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
// 		gl.uniform1i(uniLocation[4], true);
// 		gl.drawElements(gl.TRIANGLES, earthData.i.length, gl.UNSIGNED_SHORT, 0);
		
// 		// フレームバッファのバインドを解除
// 		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		
// 		// canvasを初期化
// 		gl.clearColor(0.0, 0.0, 0.0, 1.0);
// 		gl.clearDepth(1.0);
// 		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
// 		// プログラムオブジェクトの有効化(シェーダの切り替え)
// 		gl.useProgram(bPrg);
		
// 		// ブラーフィルターをかけるかどうかの真偽値
// 		var useBlur = eBlur.checked;
		
// 		// 板ポリゴンのVBOとIBOをセット
// 		set_attribute(vVBOList, bAttLocation, bAttStride);
// 		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vIndex);
		
// 		// フレームバッファに描き込んだ内容をテクスチャとして適用
// 		gl.bindTexture(gl.TEXTURE_2D, fBuffer.t);
		
// 		// ビュー×プロジェクション座標変換行列(正射影)
// 		m.lookAt([0.0, 0.0, 0.5], [0.0, 0.0, 0.0], [0, 1, 0], vMatrix);
// 		m.ortho(-1.0, 1.0, 1.0, -1.0, 0.1, 1, pMatrix);
// 		m.multiply(pMatrix, vMatrix, tmpMatrix);
		
// 		// 板ポリゴンをレンダリング
// 		m.identity(mMatrix);
// 		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
// 		gl.uniformMatrix4fv(bUniLocation[0], false, mvpMatrix);
// 		gl.uniform1i(bUniLocation[1], 0);
// 		gl.uniform1i(bUniLocation[2], useBlur);
// 		gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
		
// 		// コンテキストの再描画
// 		gl.flush();
		
// 		// ループのために再帰呼び出し
// 		setTimeout(arguments.callee, 1000 / 30);
// 	})();
	
// 	// シェーダを生成する関数
// 	function create_shader(id){
// 		// シェーダを格納する変数
// 		var shader;
		
// 		// HTMLからscriptタグへの参照を取得
// 		var scriptElement = document.getElementById(id);
		
// 		// scriptタグが存在しない場合は抜ける
// 		if(!scriptElement){return;}
		
// 		// scriptタグのtype属性をチェック
// 		switch(scriptElement.type){
			
// 			// 頂点シェーダの場合
// 			case 'x-shader/x-vertex':
// 				shader = gl.createShader(gl.VERTEX_SHADER);
// 				break;
				
// 			// フラグメントシェーダの場合
// 			case 'x-shader/x-fragment':
// 				shader = gl.createShader(gl.FRAGMENT_SHADER);
// 				break;
// 			default :
// 				return;
// 		}
		
// 		// 生成されたシェーダにソースを割り当てる
// 		gl.shaderSource(shader, scriptElement.text);
		
// 		// シェーダをコンパイルする
// 		gl.compileShader(shader);
		
// 		// シェーダが正しくコンパイルされたかチェック
// 		if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
			
// 			// 成功していたらシェーダを返して終了
// 			return shader;
// 		}else{
			
// 			// 失敗していたらエラーログをアラートする
// 			alert(gl.getShaderInfoLog(shader));
// 		}
// 	}
	
// 	// プログラムオブジェクトを生成しシェーダをリンクする関数
// 	function create_program(vs, fs){
// 		// プログラムオブジェクトの生成
// 		var program = gl.createProgram();
		
// 		// プログラムオブジェクトにシェーダを割り当てる
// 		gl.attachShader(program, vs);
// 		gl.attachShader(program, fs);
		
// 		// シェーダをリンク
// 		gl.linkProgram(program);
		
// 		// シェーダのリンクが正しく行なわれたかチェック
// 		if(gl.getProgramParameter(program, gl.LINK_STATUS)){
		
// 			// 成功していたらプログラムオブジェクトを有効にする
// 			gl.useProgram(program);
			
// 			// プログラムオブジェクトを返して終了
// 			return program;
// 		}else{
			
// 			// 失敗していたらエラーログをアラートする
// 			alert(gl.getProgramInfoLog(program));
// 		}
// 	}
	
// 	// VBOを生成する関数
// 	function create_vbo(data){
// 		// バッファオブジェクトの生成
// 		var vbo = gl.createBuffer();
		
// 		// バッファをバインドする
// 		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		
// 		// バッファにデータをセット
// 		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
		
// 		// バッファのバインドを無効化
// 		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		
// 		// 生成した VBO を返して終了
// 		return vbo;
// 	}
	
// 	// VBOをバインドし登録する関数
// 	function set_attribute(vbo, attL, attS){
// 		// 引数として受け取った配列を処理する
// 		for(var i in vbo){
// 			// バッファをバインドする
// 			gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);
			
// 			// attributeLocationを有効にする
// 			gl.enableVertexAttribArray(attL[i]);
			
// 			// attributeLocationを通知し登録する
// 			gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
// 		}
// 	}
	
// 	// IBOを生成する関数
// 	function create_ibo(data){
// 		// バッファオブジェクトの生成
// 		var ibo = gl.createBuffer();
		
// 		// バッファをバインドする
// 		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
		
// 		// バッファにデータをセット
// 		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
		
// 		// バッファのバインドを無効化
// 		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
		
// 		// 生成したIBOを返して終了
// 		return ibo;
// 	}
	
// 	// テクスチャを生成する関数
// 	function create_texture(source, number){
// 		// イメージオブジェクトの生成
// 		var img = new Image();
		
// 		// データのオンロードをトリガーにする
// 		img.onload = function(){
// 			// テクスチャオブジェクトの生成
// 			var tex = gl.createTexture();
			
// 			// テクスチャをバインドする
// 			gl.bindTexture(gl.TEXTURE_2D, tex);
			
// 			// テクスチャへイメージを適用
// 			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
			
// 			// ミップマップを生成
// 			gl.generateMipmap(gl.TEXTURE_2D);
			
// 			// テクスチャパラメータの設定
// 			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
// 			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
// 			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
// 			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
			
// 			switch(number){
// 				case 0:
// 					texture0 = tex;
// 					break;
// 				case 1:
// 					texture1 = tex;
// 					break;
// 				default:
// 					break;
// 			}
			
// 			// テクスチャのバインドを無効化
// 			gl.bindTexture(gl.TEXTURE_2D, null);
// 		};
		
// 		// イメージオブジェクトのソースを指定
// 		img.src = source;
// 	}
	
// 	// フレームバッファをオブジェクトとして生成する関数
// 	function create_framebuffer(width, height){
// 		// フレームバッファの生成
// 		var frameBuffer = gl.createFramebuffer();
		
// 		// フレームバッファをWebGLにバインド
// 		gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
		
// 		// 深度バッファ用レンダーバッファの生成とバインド
// 		var depthRenderBuffer = gl.createRenderbuffer();
// 		gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);
		
// 		// レンダーバッファを深度バッファとして設定
// 		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
		
// 		// フレームバッファにレンダーバッファを関連付ける
// 		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);
		
// 		// フレームバッファ用テクスチャの生成
// 		var fTexture = gl.createTexture();
		
// 		// フレームバッファ用のテクスチャをバインド
// 		gl.bindTexture(gl.TEXTURE_2D, fTexture);
		
// 		// フレームバッファ用のテクスチャにカラー用のメモリ領域を確保
// 		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		
// 		// テクスチャパラメータ
// 		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
// 		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
// 		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
// 		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
// 		// フレームバッファにテクスチャを関連付ける
// 		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);
		
// 		// 各種オブジェクトのバインドを解除
// 		gl.bindTexture(gl.TEXTURE_2D, null);
// 		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
// 		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		
// 		// オブジェクトを返して終了
// 		return {f : frameBuffer, d : depthRenderBuffer, t : fTexture};
// 	}
	
// };