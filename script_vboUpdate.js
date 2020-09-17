// WebGLでVBOを逐次更新しながら描画する

//Float32Arrayを使う！！！！！！
//var pointPosition = new Float32Array(sphereData.p);//型付き配列の頂点座標データが格納された状態になる！！
//この型付き配列のデータを逐次更新しながら、ループ処理のなかで動的に VBO に割り当ててやることにより、VBO が動的に更新されるようになります。





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
	c.width = 512;
    c.height = 512;
    
    // エレメントへの参照を取得
	var ePointSize = document.getElementById('point_size');
	
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
	// var pAttStride = new Array();
    // pAttStride[0] = 1;


	var uniLocation = new Array();
    uniLocation[0] = gl.getUniformLocation(prg, 'mvpMatrix');
    uniLocation[1]  = gl.getUniformLocation(prg, 'pointSize');


    // スフィアモデル
    var sphereData = sphere(64, 64, 1.0);
    // var position = sphereData.p;
    var pointPosition = new Float32Array(sphereData.p);//型付き配列の頂点座標データが格納された状態になる！！
    //この型付き配列のデータを逐次更新しながら、ループ処理のなかで動的に VBO に割り当ててやることにより、VBO が動的に更新されるようになります。

    //VBO生成とset_Attrubute
    var vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.enableVertexAttribArray(attLocation[0]);
	gl.vertexAttribPointer(attLocation[0], 3.0, gl.FLOAT, false, 0, 0);
	gl.bufferData(gl.ARRAY_BUFFER, pointPosition, gl.DYNAMIC_DRAW);//DYNAMIC_DRAWにする！！


	// // 頂点情報からVBO生成
	// var pos = create_vbo(position);
	// var idx = create_vbo(indices);
	// var pVBOList = [idx];
	// var mVBOList = [pos, idx];
	

	// 各種行列の生成と初期化
	var m = new matIV();
	var mMatrix   = m.identity(m.create());
	var vMatrix   = m.identity(m.create());
	var pMatrix   = m.identity(m.create());
	var tmpMatrix = m.identity(m.create());
	var mvpMatrix = m.identity(m.create());
	// var qMatrix   = m.identity(m.create());

	// 各種フラグを有効にする
	// gl.enable(gl.DEPTH_TEST);
    // gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.BLEND);
	
	// ブレンドファクター
	gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ONE, gl.ONE);

	
	// カウンタの宣言
    var count = 0;

    // 恒常ループ
	(function(){

        // カウンタをインクリメントする
        count++;
        // カウンタを元にラジアンを算出
        rad  = (count % 360) * Math.PI / 180;

        // フレームバッファを初期化
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT );


        // クォータニオンを行列に適用
		var qMatrix = m.identity(m.create());
        q.toMatIV(qt, qMatrix);
        
        // ビュー×プロジェクション座標変換行列
        var camPosition = [0.0, 0.0, 5.0];
		m.lookAt(camPosition, [0.0, 0.0, 0.0], [0.0, 1.0, 0.0], vMatrix);
		m.multiply(vMatrix, qMatrix, vMatrix);
        m.perspective(45, c.width / c.height, 0.1, 10.0, pMatrix);
        m.multiply(pMatrix, vMatrix, tmpMatrix);

        // 点のサイズをエレメントから取得
        var pointSize = ePointSize.value / 10;
        
        // 点を更新
		for(var i = 0, j = pointPosition.length; i < j; i += 3){
			var t = Math.cos(rad);
			var x = sphereData.p[i]     + sphereData.p[i]     * t;
			var y = sphereData.p[i + 1] + sphereData.p[i + 1] * t;
			var z = sphereData.p[i + 2] + sphereData.p[i + 2] * t;
			pointPosition[i]     = x;
			pointPosition[i + 1] = y;
			pointPosition[i + 2] = z;
		}
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, pointPosition);//これで更新を反映させる
        //gl.bufferSubDataのほうを利用すれば GPU 上のデータだけを更新することができ、動的な VBO の更新として正しく機能します。一方で従来掲載していたgl.bufferData のほうを使ってしまうと、メモリの割り当てから全てやり直すことになり、非常にオーバーヘッドの大きな処理になってしまうのだそうです。


        m.identity(mMatrix);
        m.multiply(tmpMatrix, mMatrix, mvpMatrix);
        gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
        gl.uniform1f(uniLocation[1], pointSize);


        // gl.drawElements(gl.TRIANGLES, sphereData.i.length, gl.UNSIGNED_SHORT, 0);
        // gl.drawArrays(gl.POINTS, 0, j);
        gl.drawArrays(gl.POINTS, 0, pointPosition.length / 3);

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
};

