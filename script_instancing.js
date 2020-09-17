// インスタンシング
//
// 拡張機能を使う

// ドローコール1回ですむ！
// ext.drawElementsInstancedANGLE(gl.TRIANGLES, torusData.i.length, gl.UNSIGNED_SHORT, 0, instanceCount);
//インデックスバッファを用いない場合にはext.drawArraysInstancedANGLEを利用する




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
	c.width = 512;//フレームバッファのサイズより大きくないと貼り付けたとき隙間できる！！
	c.height = 512;//フレームバッファのサイズより大きくないと貼り付けたとき隙間できる！！
	
	// イベント処理
	c.addEventListener('mousemove', mouseMove, true);
	
	// webglコンテキストを取得
    var gl = c.getContext('webgl') || c.getContext('experimental-webgl');

    // スペキュラライティングシェーダ
	var v_shader = create_shader('vs');
    var f_shader = create_shader('fs');
    
    var prg = create_program(v_shader, f_shader);
    
	var attLocation = new Array();
	attLocation[0] = gl.getAttribLocation(prg, 'position');
    attLocation[1] = gl.getAttribLocation(prg, 'normal');
    attLocation[2] = gl.getAttribLocation(prg, 'instancePosition');
    attLocation[3] = gl.getAttribLocation(prg, 'instanceColor');
    var attStride = new Array();
	attStride[0] = 3;
    attStride[1] = 3;
    attStride[2] = 3;
	attStride[3] = 4;
	var uniLocation = new Array();
	uniLocation[0] = gl.getUniformLocation(prg, 'mvpMatrix');
	uniLocation[1] = gl.getUniformLocation(prg, 'invMatrix');
	uniLocation[2] = gl.getUniformLocation(prg, 'lightDirection');
	uniLocation[3] = gl.getUniformLocation(prg, 'eyeDirection');
    
	
	// トーラスモデル
	var torusData     = torus(64, 64, 0.01, 3.0, [1.0, 1.0, 1.0, 1.0]);
	var tPosition     = create_vbo(torusData.p);
	var tNormal       = create_vbo(torusData.n);
	var tVBOList      = [tPosition, tNormal];
    var tIndex        = create_ibo(torusData.i);


    // 拡張機能を有効化
    var ext;
    ext = gl.getExtension('ANGLE_instanced_arrays');
    if(ext == null){
        alert('ANGLE_instanced_arrays not supported');
        return;
    }

    
    // 各インスタンスに適用するデータ
	
	// インスタンスの数
	var instanceCount = 100;
	
	// インスタンス用配列
	var instancePositions = new Array();
	var instanceColors = new Array();
	
	// 配列用のストライド
	var offsetPosition = 3;
	var offsetColor = 4;
	
	// ループしながらインスタンス用データを配列に格納
	for(var i = 0; i < instanceCount; i++){
		// 頂点座標
		var j = i % 10;
		var k = Math.floor(i / 10) * 0.5 + 0.5;
		var rad = (3600 / instanceCount) * j * Math.PI / 180;
		instancePositions[i * offsetPosition]     = Math.cos(rad) * k;
		instancePositions[i * offsetPosition + 1] = 0.0;
		instancePositions[i * offsetPosition + 2] = Math.sin(rad) * k;
		// 頂点カラー
		var hsv = hsva((3600 / instanceCount) * i, 1.0, 1.0, 1.0);
		instanceColors[i * offsetColor]     = hsv[0];
		instanceColors[i * offsetColor + 1] = hsv[1];
		instanceColors[i * offsetColor + 2] = hsv[2];
		instanceColors[i * offsetColor + 3] = hsv[3];
	}
	
	// 配列からVBOを生成
	var iPosition = create_vbo(instancePositions);
	var iColor = create_vbo(instanceColors);
	
	// トーラスの attribute 関連
	set_attribute(tVBOList, attLocation, attStride);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndex);
	
	// インスタンス用の座標位置VBOを有効にする = set_attributeの中身と一緒
	gl.bindBuffer(gl.ARRAY_BUFFER, iPosition);
	gl.enableVertexAttribArray(attLocation[2]);
	gl.vertexAttribPointer(attLocation[2], attStride[2], gl.FLOAT, false, 0, 0);
	
	// インスタンスを有効化し除数を指定する
	ext.vertexAttribDivisorANGLE(attLocation[2], 1)
	
	// インスタンス用の色情報VBOを有効にする
	gl.bindBuffer(gl.ARRAY_BUFFER, iColor);
	gl.enableVertexAttribArray(attLocation[3]);
	gl.vertexAttribPointer(attLocation[3], attStride[3], gl.FLOAT, false, 0, 0);
	
	// インスタンスを有効化し除数を指定する
    ext.vertexAttribDivisorANGLE(attLocation[3],3);//除数（第二引数）変えられる！
    // ext.vertexAttribDivisorANGLE(attLocation[3], 50);

	
	// 各種行列の生成と初期化
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
    gl.enable(gl.CULL_FACE);

    
    var eyePosition = new Array();
	var camUpDirection = new Array();
    
    // ライトの向き
	var lightDirection = [-0.577, 0.577, 0.577];
	
	// カウンタの宣言
    var count = 0;


    // 恒常ループ
	(function(){

        // カウンタをインクリメントする
        count++;
        // カウンタを元にラジアンを算出
        var rad  = (count % 360) * Math.PI / 180;

        // フレームバッファを初期化
		gl.clearColor(0.3, 0.3, 0.3, 1.0);
		gl.clearDepth(1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // モデル座標変換行列の生成
        q.toVecIII([0.0, 10.0, 0.0], qt, eyePosition);
        q.toVecIII([0.0, 0.0, -1.0], qt, camUpDirection);
        m.lookAt(eyePosition, [0, 0, 0], camUpDirection, vMatrix);
        m.perspective(90, 1.0, 0.1, 200, pMatrix);
        m.multiply(pMatrix, vMatrix, tmpMatrix);


        m.identity(mMatrix);
        // m.rotate(mMatrix, i * 2 * Math.PI / 9, [0, 1, 0], mMatrix);
        // m.translate(mMatrix, [0.0, 0.0, 10.0], mMatrix);
        m.rotate(mMatrix, rad, [1, 1, 1], mMatrix);
        m.multiply(tmpMatrix, mMatrix, mvpMatrix);
        m.inverse(mMatrix, invMatrix);
        gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
        gl.uniformMatrix4fv(uniLocation[1], false, invMatrix);
        gl.uniform3fv(uniLocation[2], lightDirection);
        gl.uniform3fv(uniLocation[3], eyePosition);

        // gl.drawElements(gl.TRIANGLES, torusData.i.length, gl.UNSIGNED_SHORT, 0);
        ext.drawElementsInstancedANGLE(gl.TRIANGLES, torusData.i.length, gl.UNSIGNED_SHORT, 0, instanceCount);//インスタンシングを使う場合はこっち！第五引数までとる！！


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
		// フレームバッファの生成
		var frameBuffer = gl.createFramebuffer();
		
		// フレームバッファをWebGLにバインド
		gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
		
		// 深度バッファ用レンダーバッファの生成とバインド
		var depthRenderBuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);
		
		// レンダーバッファを深度バッファとして設定
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
		
		// フレームバッファにレンダーバッファを関連付ける
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);
		
		// フレームバッファ用テクスチャの生成
		var fTexture = gl.createTexture();
		
		// フレームバッファ用のテクスチャをバインド
		gl.bindTexture(gl.TEXTURE_2D, fTexture);
		
		// フレームバッファ用のテクスチャにカラー用のメモリ領域を確保
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
		
		// オブジェクトを返して終了
		return {f : frameBuffer, d : depthRenderBuffer, t : fTexture};
	}


    // キューブマップテクスチャを生成する関数
    function create_cube_texture(source, target){
        // インスタンス用の配列
        var cImg = new Array();
        
        for(var i = 0; i < source.length; i++){
            // インスタンスの生成
            cImg[i] = new cubeMapImage();
            
            // イメージオブジェクトのソースを指定
            cImg[i].data.src = source[i];
        }
        
        // キューブマップ用イメージのコンストラクタ
        function cubeMapImage(){
            // イメージオブジェクトを格納
            this.data = new Image();
            
            // イメージロードをトリガーにする
            this.data.onload = function(){
                // プロパティを真にする
                this.imageDataLoaded = true;
                
                // チェック関数を呼び出す
                checkLoaded();
            };
        }
    
        // イメージロード済みかチェックする関数
        function checkLoaded(){
            // 全てロード済みならキューブマップを生成する関数を呼び出す
            if( cImg[0].data.imageDataLoaded &&
                cImg[1].data.imageDataLoaded &&
                cImg[2].data.imageDataLoaded &&
                cImg[3].data.imageDataLoaded &&
                cImg[4].data.imageDataLoaded &&
                cImg[5].data.imageDataLoaded){generateCubeMap();}
        }
        
        // キューブマップを生成する関数
        function generateCubeMap(){
            // テクスチャオブジェクトの生成
            var tex = gl.createTexture();
            
            // テクスチャをキューブマップとしてバインドする
            //gl.TEXTURE_2Dを使っていましたが、キューブマップ用のテクスチャにはこちらを使う
            //割り当ての対象となる「テクスチャオブジェクト」はあくまでも一つだけです。
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);
            
            // ソースを順に処理する
            for(var j = 0; j < source.length; j++){
                // テクスチャへイメージを適用
                //いったいどの画像が、どの面を表しているものなのか、WebGL はどうやって判断
                gl.texImage2D(target[j], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cImg[j].data);
            }
            
            // ミップマップを生成
            gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
            
            // テクスチャパラメータの設定
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            
            // キューブマップテクスチャを変数に代入
            cubeTexture = tex;
            
            // テクスチャのバインドを無効化
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
        }
    }

};

