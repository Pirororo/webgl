//テクスチャマッピング
//縦横のピクセルサイズが 32 x 32 や、128 x 128 など、2 の累乗となっている画像データが必要なのですね。
//textureCoordはattribute変数 vec2
//textureはuniform変数 sampler2D
//gl.textureBind(texture);はdrawでやらないとだめ！


onload = function(){

    // チェックボックスの参照を取得
	var che_culling = document.getElementById('cull');
    var che_depth_test = document.getElementById('depth');

    //canvas 要素への参照を得る *****
    var c = document.getElementById("canvas");
    c.width = 500;
    c.height = 300;

    //canvas 要素からコンテキストオブジェクトを取得する
    var gl = c.getContext('webgl') || c.getContext('experimental-webgl');


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
    attLocation[1] = gl.getAttribLocation(prg, 'color');
    attLocation[2] = gl.getAttribLocation(prg, 'textureCoord');

    // attributeの要素数を配列に格納
    var attStride = new Array(3);
    attStride[0] = 3;
    attStride[1] = 4;
    attStride[2] = 2;

    //テクスチャをはるための頂点データ
    var texPos = [
        -1.0, 1.0, 0.0,
        1.0, 1.0, 0.0,
        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0,
    ];
    var texCol = [ 
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0, 1.0
    ];
    var texTxcrd = [
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0
    ];
    var texIdx = [
        0,2,1,
        3,1,2
    ];

    var texPosition = create_vbo(texPos);
    var texColor = create_vbo(texCol);
    var texTextureCoord = create_vbo(texTxcrd);
    var texVBOList = [texPosition, texColor, texTextureCoord];
    var texIndex = create_ibo(texIdx);

    // VBOとIBOをセット   ************
    set_attribute(texVBOList, attLocation, attStride);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, texIndex);

    // uniformLocationの取得
    var uniLocation = new Array();//増えたら配列にする！
    uniLocation[0] = gl.getUniformLocation(prg, 'mvpMatrix');
    uniLocation[1] = gl.getUniformLocation(prg, 'texture');


    // 有効にするテクスチャユニットを指定
    // ユニットはテクスチャに番号をつけて管理するためのもので、既定では 0 番のテクスチャユニットが有効
    gl.activeTexture(gl.TEXTURE0);
    //テクスチャ用変数の宣言
    var texture = null;
    // テクスチャオブジェクトの生成
    create_texture('data/webgl.png');
    // // テクスチャをバインドする→バインドはdraw内ではなくてはだめなようだ！！！！there is no texture bound to the unit 0
    // gl.bindTexture(gl.TEXTURE_2D, texture);



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

    // ビュー×プロジェクション座標変換行列
    m.lookAt([0.0, 0.0, 3.0], [0, 0, 0], [0, 1, 0], vMatrix);
    m.perspective(45, c.width / c.height, 0.1, 100, pMatrix);
    m.multiply(pMatrix, vMatrix, tmpMatrix);


    // カウンタの宣言
    var count = 0;

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);//gl.LEQUAL

    // 恒常ループ
    (function(){

        // canvasを初期化する色を設定する
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        count++;

        // テクスチャをバインドする
		gl.bindTexture(gl.TEXTURE_2D, texture);
        // uniform変数にテクスチャを登録
        //行列やベクトルをシェーダに送るのとは違い、あくまでもテクスチャユニットの番号を送っているだけ
        gl.uniform1i(uniLocation[1], 0);//iはint,0はユニット番号

 
        // カウンタを元にラジアンと各種座標を算出
        var rad = (count % 360) * Math.PI / 180;
        // var tx = Math.cos(rad) * 3.5;
        // var ty = Math.sin(rad) * 3.5;
        // var tz = Math.sin(rad) * 3.5;


        // モデル座標変換行列の生成
		m.identity(mMatrix);
        // m.translate(mMatrix, [tx, -ty, -tz], mMatrix);
        m.rotate(mMatrix, 10*rad, [1, 1, 0], mMatrix);
        m.multiply(tmpMatrix, mMatrix, mvpMatrix);

        gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);


        //この第二引数は生の配列を入れる。生成したvboのtIndexでは真っ暗になる。
        gl.drawElements(gl.TRIANGLES, texIdx.length, gl.UNSIGNED_SHORT, 0);

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
            gl.generateMipmap(gl.TEXTURE_2D);
            // テクスチャのバインドを無効化
            gl.bindTexture(gl.TEXTURE_2D, null);
            // 生成したテクスチャをグローバル変数に代入
            texture = tex;
        }

        
    }

}

