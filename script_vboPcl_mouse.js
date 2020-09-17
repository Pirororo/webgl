// VBOパーティクル2D

//今回二次元。100*100 = 10000個！



onload = function(){

    var c; // canvas エレメント
	var mouseFlag = false;    // マウス操作のフラグ
	var mousePositionX = 0.0; // マウス座標X（-1.0 から 1.0）
    var mousePositionY = 0.0; // マウス座標Y（-1.0 から 1.0）
    
	// canvasエレメントを取得
	c = document.getElementById('canvas');
	// c.width = 512;
    // c.height = 512;
    c.width = Math.min(window.innerWidth, window.innerHeight);
	c.height = c.width;

    // イベント登録
	c.addEventListener('mousedown', mouseDown, true);
	c.addEventListener('mouseup', mouseUp, true);
	c.addEventListener('mousemove', mouseMove, true);
	
	// webglコンテキストを取得
	var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
	
    // シェーダ用変数
	var v_shader;
	var f_shader;
	
	// 点のレンダリングを行うシェーダ
	v_shader = create_shader('vs');
	f_shader = create_shader('fs');
	var prg = create_program(v_shader, f_shader);
	
	// locationの初期化
	var attLocation = new Array();
	attLocation[0] = gl.getAttribLocation(prg, 'position');
	var pAttStride = new Array();
    pAttStride[0] = 2;


    // 下準備
    var position = []; // 頂点座標
    var vector = [];   // 頂点の進行方向ベクトル
    var resolutionX = 100; // 頂点の配置解像度X
    var resolutionY = 100; // 頂点の配置解像度Y
    var intervalX = 1.0 / resolutionX; // 頂点間の間隔X
    var intervalY = 1.0 / resolutionY; // 頂点間の間隔Y
    var verticesCount = resolutionX * resolutionY; // 頂点の個数
    (function(){
        var i, j, x, y;
        for(i = 0; i < resolutionX; i++){
            for(j = 0; j < resolutionY; j++){
                // 頂点の座標
                x = i * intervalX * 2.0 - 1.0;
                y = j * intervalY * 2.0 - 1.0;
                position.push(x, y);
                
                // 頂点のベクトル
                vector.push(0.0, 0.0);
            }
        }
    })();


    //VBO生成とset_Attrubute
    var pointPosition = new Float32Array(position);
    var vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.enableVertexAttribArray(attLocation[0]);
	gl.vertexAttribPointer(attLocation[0], 2.0, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, pointPosition, gl.DYNAMIC_DRAW);//DYNAMIC_DRAWにする！！
    
    // uniformLocationを配列に取得
	var uniLocation = new Array();
	uniLocation[0]  = gl.getUniformLocation(prg, 'pointSize');//pointSizeはvelが早いほど大きくしてる
	uniLocation[1]  = gl.getUniformLocation(prg, 'pointColor');


	// 各種フラグを有効にする
	gl.enable(gl.BLEND);
	
	// ブレンドファクター
	gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ONE, gl.ONE);

	
	// カウンタの宣言
    var count = 0;

    // 速度関連
	var velocity = 0.0;
	var MAX_VELOCITY = 2.0;
    var SPEED = 0.02;
    

    // 恒常ループ
	(function(){

        // カウンタをインクリメントする
        count++;
        // カウンタを元にラジアンを算出
        rad  = (count % 360) * Math.PI / 180;

        // フレームバッファを初期化
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT );
        
        // カウンタから色を算出
		count++;
		var pointColor = hsva((count % 720) / 2, 1.0, 1.0, 0.5);
		
		// マウスフラグを見て速度を修正
		if(mouseFlag){
			velocity = MAX_VELOCITY;
		}else{
			velocity *= 0.95;
		}

        // 点を更新
		for(i = 0; i < resolutionX; i++){
			k = i * resolutionX;
			for(j = 0; j < resolutionY; j++){
				l = (k + j) * 2;
				// マウスフラグを見てベクトルを更新する
				if(mouseFlag){
					var p = vectorUpdate(
						pointPosition[l],
						pointPosition[l + 1],
						mousePositionX,
						mousePositionY,
						vector[l],
						vector[l + 1]
					);
					vector[l]     = p[0];
					vector[l + 1] = p[1];
				}
				pointPosition[l]     += vector[l]     * velocity * SPEED;
				pointPosition[l + 1] += vector[l + 1] * velocity * SPEED;
			}
		}
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, pointPosition);

        // 点を描画
		gl.uniform1f(uniLocation[0], velocity * 1.25 + 0.25);
		gl.uniform4fv(uniLocation[1], pointColor);
        gl.drawArrays(gl.POINTS, 0, verticesCount);

		// コンテキストの再描画
		gl.flush();
		
		// ループのために再帰呼び出し
		setTimeout(arguments.callee, 1000 / 30);


    })();


    // イベント処理
	function mouseDown(eve){
		mouseFlag = true;
	}
	function mouseUp(eve){
		mouseFlag = false;
	}
	function mouseMove(eve){
		if(mouseFlag){
			var cw = c.width;
			var ch = c.height;
			mousePositionX = (eve.clientX - c.offsetLeft - cw / 2.0) / cw * 2.0;
			mousePositionY = -(eve.clientY - c.offsetTop - ch / 2.0) / ch * 2.0;
		}
	}
	
	// ベクトル演算
	function vectorUpdate(x, y, tx, ty, vx, vy){
		var px = tx - x;
		var py = ty - y;
		var r = Math.sqrt(px * px + py * py) * 5.0;
		if(r !== 0.0){
			px /= r;
			py /= r;
		}
		px += vx;
		py += vy;
		r = Math.sqrt(px * px + py * py);
		if(r !== 0.0){
			px /= r;
			py /= r;
		}
		return [px, py];
	}


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
};

