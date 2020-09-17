// キューブ環境マッピング
// gl.TEXTURE_CUBE_MAPを使う！！（gl.TEXTURE_2Dではない！）

// キューブマップテクスチャを生成する関数
//function create_cube_texture(source, target){
//使用するテクスチャオブジェクトは１つだが、画像は６つ用意して、gl.texImage2D(target[j], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cImg[j].data)でそれぞれの面に割り当てる
//向きはこの向きこの６枚画像の向きでやればcubeのnormalそのままいい感じにはりつけられる。ちなみに今回normaltexturecoodは要らない！！！！！！！！！！！
//lightは今回消してる〜（マストではない）
//eyePosiitonを包むようにcubeのサイズを大きくする！！

//gl.activeTexture(gl.TEXTURE0);は要らないようだ
// gl.useProgram(prg);は要らないようだ


//html
//uniform samplerCube  cubeTexture;
//vec4 envColor = textureCube(cubeTexture, ref);
//reflect関数





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
	c.width = 500;
	c.height = 500;
	
	// イベント処理
	c.addEventListener('mousemove', mouseMove, true);
	
	// webglコンテキストを取得
    var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    
    // エレメントへの参照を取得
    var eBlur = document.getElementById('blur');
 
	// 頂点シェーダとフラグメントシェーダの生成
	var v_shader = create_shader('vs');
	var f_shader = create_shader('fs');
	
	// プログラムオブジェクトの生成とリンク
    var prg = create_program(v_shader, f_shader);
    
    // // プログラムオブジェクトの有効化
	// gl.useProgram(prg);
	
	// attributeLocationを配列に取得
	var attLocation = new Array();
	attLocation[0] = gl.getAttribLocation(prg, 'position');
	attLocation[1] = gl.getAttribLocation(prg, 'normal');
	attLocation[2] = gl.getAttribLocation(prg, 'color');
	// attLocation[3] = gl.getAttribLocation(prg, 'textureCoord');
	
	// attributeの要素数を配列に格納
	var attStride = new Array();
	attStride[0] = 3;
	attStride[1] = 3;
	attStride[2] = 4;
	// attStride[3] = 2;
	

    // VBOとIBOの生成
	// キューブモデル
	var cubeData     = cube(2.0, [1.0, 1.0, 1.0, 1.0]);
	var cPosition     = create_vbo(cubeData.p);
	var cNormal       = create_vbo(cubeData.n);
	var cColor        = create_vbo(cubeData.c);
    var cVBOList      = [cPosition, cNormal, cColor];
    var cIndex        = create_ibo(cubeData.i);
    
    // 球体モデル
	var earthData     = sphere(64, 64, 1.0, [1.0, 1.0, 1.0, 1.0]);
	var ePosition     = create_vbo(earthData.p);
	var eNormal       = create_vbo(earthData.n);
	var eColor        = create_vbo(earthData.c);
	var eVBOList      = [ePosition, eNormal, eColor];
    var eIndex        = create_ibo(earthData.i);
    
    // トーラスモデル
    var torusData     =  torus(64, 63, 0.5, 1.0, [1.0, 1.0, 1.0, 1.0]);
	var tPosition     = create_vbo(torusData.p);
	var tNormal       = create_vbo(torusData.n);
	var tColor        = create_vbo(torusData.c);
	var tVBOList      = [tPosition, tNormal, tColor];
    var tIndex        = create_ibo(torusData.i);
    
	// uniformLocationを配列に取得
	var uniLocation = new Array();
    uniLocation[0]  = gl.getUniformLocation(prg, 'mMatrix');
    uniLocation[1]  = gl.getUniformLocation(prg, 'mvpMatrix');
	// uniLocation[2]  = gl.getUniformLocation(prg, 'invMatrix');
    // uniLocation[3]  = gl.getUniformLocation(prg, 'lightDirection');
    uniLocation[2]  = gl.getUniformLocation(prg, 'eyePosition');
    uniLocation[3] = gl.getUniformLocation(prg, 'reflection');//bool
    uniLocation[4]  = gl.getUniformLocation(prg, 'cubeTexture');


    var m = new matIV();
	var mMatrix   = m.identity(m.create());
	var vMatrix   = m.identity(m.create());
	var pMatrix   = m.identity(m.create());
	var tmpMatrix = m.identity(m.create());
	var mvpMatrix = m.identity(m.create());
	// var invMatrix = m.identity(m.create());

	// 各種フラグを有効にする
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);

	// // テクスチャ用変数の宣言と生成
    // var texture0 = null;
    // var texture1 = null;
    // create_texture('data/texture0.png', 0);
    // create_texture('texture.png', 1);
    // gl.activeTexture(gl.TEXTURE0);


    // テクスチャ用の変数を用意
    var cubeTexture = null;
    // キューブマップ用イメージのソースを配列に格納
    var cubeSourse = new Array( 'data/cube_PX.png',
                                'data/cube_PY.png',
                                'data/cube_PZ.png',
                                'data/cube_NX.png',
                                'data/cube_NY.png',
                                'data/cube_NZ.png');
    // キューブマップ用のターゲットを格納する配列
    var cubeTarget = new Array( gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                                gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
                                gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                                gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                                gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                                gl.TEXTURE_CUBE_MAP_NEGATIVE_Z);
    // キューブマップテクスチャの生成
    create_cube_texture(cubeSourse, cubeTarget);

    //カウンタの宣言
    var count = 0;

    // 目線
    var　eyePosition = [];


    // 恒常ループ
	(function(){

        // カウンタをインクリメントする
        count++;

        // カウンタを元にラジアンを算出
        var rad  = (count % 360) * Math.PI / 180;
        var rad2  = (count % 720) * Math.PI / 180;

        // カンバスを初期化
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        // ビュー×プロジェクション座標変換行列
		var camUp = new Array();
		q.toVecIII([0.0, 0.0, 10.0], qt, eyePosition);
		q.toVecIII([0.0, 1.0, 0.0], qt, camUp);
		m.lookAt(eyePosition, [0, 0, 0], camUp, vMatrix);
		m.perspective(45, c.width / c.height, 0.1, 200, pMatrix);
		m.multiply(pMatrix, vMatrix, tmpMatrix);


        //背景用のキューブ
        //IBOとVBOをセット
        set_attribute(cVBOList, attLocation, attStride);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cIndex);
        // 背景用球体をフレームバッファにレンダリング
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
		m.identity(mMatrix);
		m.scale(mMatrix, [100.0, 100.0, 100.0], mMatrix);//cubeのサイズを大きくする！！
        m.multiply(tmpMatrix, mMatrix, mvpMatrix);
        //ユニフォーム変数を送る
		gl.uniformMatrix4fv(uniLocation[0], false, mMatrix);
		gl.uniformMatrix4fv(uniLocation[1], false, mvpMatrix);
		gl.uniform3fv(uniLocation[2], eyePosition);
		gl.uniform1i(uniLocation[3], false);//bool,cubeはboolにして反射を計算させない！
		gl.uniform1i(uniLocation[4], 0);
        gl.drawElements(gl.TRIANGLES, cubeData.i.length, gl.UNSIGNED_SHORT, 0);


        //球体
        //IBOとVBOをセット
        set_attribute(eVBOList, attLocation, attStride);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, eIndex);
        // 背景用球体をフレームバッファにレンダリング
		m.identity(mMatrix);
        m.rotate(mMatrix, rad, [0, 1, 0], mMatrix);
        m.translate(mMatrix, [1, 1, 1], mMatrix);
        m.multiply(tmpMatrix, mMatrix, mvpMatrix);
        //ユニフォーム変数を送る
		gl.uniformMatrix4fv(uniLocation[0], false, mMatrix);
		gl.uniformMatrix4fv(uniLocation[1], false, mvpMatrix);
		gl.uniform1i(uniLocation[3], true);//bool,反射を計算させる！
        gl.drawElements(gl.TRIANGLES, earthData.i.length, gl.UNSIGNED_SHORT, 0);


        //トーラス
        //IBOとVBOをセット
        set_attribute(tVBOList, attLocation, attStride);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndex);
        // 背景用球体をフレームバッファにレンダリング
		m.identity(mMatrix);
        m.rotate(mMatrix, rad2, [0, 1, 0], mMatrix);
        m.translate(mMatrix, [-1, -1, -1], mMatrix);
        m.rotate(mMatrix, rad, [1, 0, 1], mMatrix);
        m.multiply(tmpMatrix, mMatrix, mvpMatrix);
        //ユニフォーム変数を送る
		gl.uniformMatrix4fv(uniLocation[0], false, mMatrix);
		gl.uniformMatrix4fv(uniLocation[1], false, mvpMatrix);
		gl.uniform1i(uniLocation[3], true);//bool,反射を計算させる！
        gl.drawElements(gl.TRIANGLES, torusData.i.length, gl.UNSIGNED_SHORT, 0);



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

