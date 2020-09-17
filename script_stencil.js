//ステンシルバッファ
// 以下の部分、223~225をオフにするとトーラスとスフィアでてくるんだけどパネルと一緒には出せない。。。パネルとトーラススフィア一緒に出すにはどうするのかな
// // VBOとIBOをセット   ************
// set_attribute(vVBOList, attLocation, attStride);
// gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vIndex);


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

    // チェックボックスの参照を取得
	var che_culling = document.getElementById('cull');
    var che_depth_test = document.getElementById('depth');

    //canvas 要素への参照を得る *****
    // var c = document.getElementById("canvas");
    c = document.getElementById("canvas");
    c.width = 500;
    c.height = 300;

    // canvas のマウスムーブイベントに処理を登録
    c.addEventListener('mousemove', mouseMove, true);


    //コンテキストとは
    //webglコンテキストは
    //canvas 要素からコンテキストオブジェクトを取得するためのメソッドで、引数には文字列で取得したいコンテキストの名称を渡します。
    var gl = c.getContext('webgl', {stencil: true})|| c.getContext('experimental-webgl', {stencil: true});


    //シェーダのコンパイル *****
    var v_shader = create_shader('vs');//シングルコーテーション！
    var f_shader = create_shader('fs');//シングルコーテーション！
    //プログラムオブジェクトの生成とリンク
    var prg = create_program(v_shader, f_shader);

    //attLocationとattStrideは頂点シェーダにデータを渡す際に必要となる情報を保持する
    // attributeLocationの取得（戻り値として返される数値が、頂点シェーダにデータを渡す際のインデックスになる。＝そのデータが何番目の attribute 変数なのか）
    // attributeLocationを配列に取得
    var attLocation = new Array(3);
    attLocation[0] = gl.getAttribLocation(prg, 'position');
    attLocation[1] = gl.getAttribLocation(prg, 'normal');
    attLocation[2] = gl.getAttribLocation(prg, 'color');
    attLocation[3] = gl.getAttribLocation(prg, 'textureCoord');
    // attributeの要素数(この場合は xyz の3要素)
    // attributeの要素数を配列に格納
    var attStride = new Array(3);
    attStride[0] = 3;
    attStride[1] = 3;
    attStride[2] = 4;
    attStride[3] = 2;

    // モデルデータを用意 *****
    var torusData = torus(64, 64, 0.5, 1.5);
    var sphereData = sphere(64, 64, 2.0);
    // 板ポリゴンの頂点属性
	var position = [
		-1.0,  1.0,  0.0,
		 1.0,  1.0,  0.0,
		-1.0, -1.0,  0.0,
		 1.0, -1.0,  0.0
	];
	var normal = [
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0
	];
	var color = [
		1.0, 0.0, 0.0, 1.0,
		0.0, 1.0, 0.0, 1.0,
		0.0, 0.0, 1.0, 1.0,
		1.0, 1.0, 1.0, 1.0
	];
	var textureCoord = [
		0.0, 0.0,
		1.0, 0.0,
		0.0, 1.0,
		1.0, 1.0
	];
    var index = [
		0, 2, 1,
		2, 3, 1
    ];

    //頂点バッファ( VBO )の生成と通知 *****
    //頂点バッファー処理
    //1.頂点の各情報をいったん配列に格納
    //2.WebGL のメソッドを使って VBO を生成
    //3.WebGL のメソッドを使い VBO に配列のデータを転送
    //4.頂点シェーダ内の attribute 変数と VBO を紐付ける
    var tPosition = create_vbo(torusData.p);
    var tNormal = create_vbo(torusData.n);
    var tColor = create_vbo(torusData.c);
    var tVBOList = [tPosition, tNormal, tColor];
    var tIndex = create_ibo(torusData.i);

    var sPosition = create_vbo(sphereData.p);
    var sNormal = create_vbo(sphereData.n);
    var sColor = create_vbo(sphereData.c);
    var sVBOList = [sPosition, sNormal, sColor];
    var sIndex = create_ibo(sphereData.i);

    var vPosition = create_vbo(position);
    var vNormal = create_vbo(normal);
    var vColor = create_vbo(color);
    var vTextureCoord = create_vbo(textureCoord);
    var vVBOList = [vPosition, vNormal, vColor, vTextureCoord];
    var vIndex = create_ibo(index);

    // // VBOをバインド
    // set_attribute(tVBOs, attLocation, attStride);
    // // IBOをバインド
    // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndex);
    


    // uniformLocationの取得
    var uniLocation = new Array();//増えたら配列にする！
    uniLocation[0] = gl.getUniformLocation(prg, 'mvpMatrix');
    uniLocation[1] = gl.getUniformLocation(prg, 'mMatrix');
    uniLocation[2] = gl.getUniformLocation(prg, 'invMatrix');//逆行列
    // uniLocation[2] = gl.getUniformLocation(prg, 'lightDirection');//平行光の方向
    uniLocation[3] = gl.getUniformLocation(prg, 'lightPosition');//点光源の位置
    uniLocation[4] = gl.getUniformLocation(prg, 'ambientColor');//環境光の色
    uniLocation[5] = gl.getUniformLocation(prg, 'camPosition');//目線の方向

    uniLocation[6] = gl.getUniformLocation(prg, 'texture');//目線の方向



    //座標変換行列の生成と通知 *****
    //拡大縮小 > 回転 > 移動、という順序で
    // matIVオブジェクト（minMatrix.jsのオブジェクト）を生成
    var m = new matIV();
    // 各種行列の生成と初期化
    var mMatrix = m.identity(m.create());   // モデル変換行列
    var vMatrix = m.identity(m.create());   // ビュー変換行列
    var pMatrix = m.identity(m.create());   // プロジェクション変換行列
    var tmpMatrix = m.identity(m.create()); // pvまでの座標変換行列
    var mvpMatrix = m.identity(m.create()); // 最終座標変換行列
    var invMatrix = m.identity(m.create()); // 逆行列


    // // 平行光源の向き
    // var lightDirection = [-0.5, 0.5, 0.5];//向きだからアルファいらない
    // 点光源の位置
    var lightPosition = [0.0, 0.0, 0.0];
    // 環境光の色
    var ambientColor = [0.1, 0.1, 0.1, 1.0];//アルファ1.0
    // //  視点ベクトルの向き
    // var eyeDirection = [0.0, 0.0, 20.0];
    // カメラの座標
    var camPosition = [0.0, 0.0, 10.0];
    // カメラの上方向を表すベクトル
    var camUpDirection　= [0.0, 1.0, 0.0];


    // カウンタの宣言
    var count = 0;

    //各種フラグを有効にする
    // gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);//gl.LEQUAL


    // テクスチャ用変数の宣言と生成
	var texture = null;
	create_texture('texture.png');

    // 恒常ループ
    (function(){

        
        // canvasを初期化する色を設定する
        gl.clearColor(0.0, 0.7, 0.7, 1.0);
        gl.clearDepth(1.0);
        gl.clearStencil(0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

        count++;

        //まずはトーラス
        // カウンタを元にラジアンと各種座標を算出
        var rad = (count % 360) * Math.PI / 180;
        var tx = Math.cos(rad) * 3.5;
        var ty = Math.sin(rad) * 3.5;
        var tz = Math.sin(rad) * 3.5;

        // VBOとIBOをセット   ************
        set_attribute(vVBOList, attLocation, attStride);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vIndex);

        //行列matIVへの変化(クォータニオンを行列に適用)
        var qMatrix = m.identity(m.create());
        q.toMatIV(qt, qMatrix);

        // ビュー×プロジェクション座標変換行列
        m.lookAt(camPosition, [0, 0, 0], camUpDirection, vMatrix);
        m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
        m.multiply(vMatrix, qMatrix, vMatrix);
        m.multiply(pMatrix, vMatrix, tmpMatrix);

        // テクスチャをバインドし登録する
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.uniform1i(uniLocation[6], 0);
		
		// ステンシルテストを有効にする
        gl.enable(gl.STENCIL_TEST);
        
        // 描画:1
		gl.stencilFunc(gl.ALWAYS, 1, ~0);
		gl.stencilOp(gl.KEEP, gl.REPLACE, gl.REPLACE);
		render([-0.25, 0.25, -0.5]);
		
		// 描画:2
		gl.stencilFunc(gl.ALWAYS, 0, ~0);
		gl.stencilOp(gl.KEEP, gl.INCR, gl.INCR);
		render([0.0, 0.0, 0.0]);
		
		// 描画:3
		gl.stencilFunc(gl.EQUAL, 2, ~0);
		gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
        render([0.25, -0.25, 0.5]);

        function render(tr){
			// モデル座標変換行列の生成
			m.identity(mMatrix);
			m.translate(mMatrix, [tr[0], tr[1], tr[2]], mMatrix);
			m.multiply(tmpMatrix, mMatrix, mvpMatrix);
			m.inverse(mMatrix, invMatrix);
			
			// uniform変数の登録と描画
			gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
			gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
			gl.uniform3fv(uniLocation[3], lightPosition);
			gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
        }
        
        
        // ステンシルテストを無効にする
		gl.disable(gl.STENCIL_TEST);

        // トーラスのVBOとIBOをセット   ************
        set_attribute(tVBOList, attLocation, attStride);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndex);

        // トーラスのモデル座標変換行列の生成
        m.identity(mMatrix);
        m.translate(mMatrix, [2.0, 2.0, 0.0], mMatrix);
        // m.rotate(mMatrix, rad, [0, 1, 1], mMatrix);
        m.multiply(tmpMatrix, mMatrix, mvpMatrix);
        m.inverse(mMatrix, invMatrix);

        gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
        gl.uniformMatrix4fv(uniLocation[1], false, mMatrix);
        gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
        gl.uniform3fv(uniLocation[3], lightPosition);
        gl.uniform4fv(uniLocation[4], ambientColor);
        gl.uniform3fv(uniLocation[5], camPosition);

        //この第二引数は生の配列を入れる。生成したvboのtIndexでは真っ暗になる。
        gl.drawElements(gl.TRIANGLES, torusData.i.length, gl.UNSIGNED_SHORT, 0);

        //次にスフィア
        //スフィアのVBOとIBOをセット
        set_attribute(sVBOList, attLocation, attStride);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sIndex);

        // スフィアのモデル座標変換行列の生成
		m.identity(mMatrix);
        m.translate(mMatrix, [-2.0, -2.0, 0.0], mMatrix);
        // m.rotate(mMatrix, rad, [1, 1, 0], mMatrix);
        m.multiply(tmpMatrix, mMatrix, mvpMatrix);
        m.inverse(mMatrix, invMatrix);

        gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
        gl.uniformMatrix4fv(uniLocation[1], false, mMatrix);
        gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
        //他のuniformはトーラスと同じなので送らなくていい

        gl.drawElements(gl.TRIANGLES, sphereData.i.length, gl.UNSIGNED_SHORT, 0);



        // コンテキストの再描画
        gl.flush();
        // ループのために再帰呼び出し
        setTimeout(arguments.callee, 1000 / 30);

    })();



    //**********  関数  **********//

    //シェーダのコンパイル
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

    //シェーダをリンクし管理(varying変数を送ったり)してくれるプログラムオブジェクトに関する関数
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


    //vboの生成
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
        for(let i in vbo){
            // バッファをバインドする
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);
            // attribute属性を有効にする
            gl.enableVertexAttribArray(attL[i]);
            // attribute属性を登録
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

    // テクスチャを生成する関数,ソースは画像のアドレス
    function create_texture(source){
        // イメージオブジェクトの生成
        var img = new Image();
        // イメージオブジェクトのソースを指定
        img.src = source;

        // データのオンロードをトリガーにする
        //画像が読み込まれたと同時にテクスチャに関する処理が自動的に実行されるようになります。
        img.onload = function(){
            //テクスチャオブジェクトの生成
            var tex = gl.createTexture();
            //テクスチャオブジェクトをwebglにバインドする
            //第一引数にはテクスチャの種類を表す組み込み定数を指定しますが、いわゆる普通の二次元画像フォーマットであればこの引数には gl.TEXTURE_2D を常に指定します。第二引数にはバインドするテクスチャオブジェクトを指定
            gl.bindTexture(gl.TEXTURE_2D,tex);
            //画像をテクスチャオブジェクトにバインド
            //第一引数は bindTexture でも使ったテクスチャの種類を指定します。ここでも組み込み定数 gl.TEXTURE_2D を使えば問題ありません。第二引数はミップマップのレベルを指定、第三引数と第四引数には同じ組み込み定数 gl.RGBA を指定、第五引数の gl.UNSIGNED_BYTE についても特別な理由がない限りこのままで大丈夫です。
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            // ミップマップを生成
            //あらかじめ小さいサイズの画像もつくっておく（イメージ縮小表示のときのみに対応）
            gl.generateMipmap(gl.TEXTURE_2D);
            // テクスチャのバインドを無効化
            gl.bindTexture(gl.TEXTURE_2D, null);
            // 生成したテクスチャをグローバル変数に代入
            texture = tex;
        }
    }



}

