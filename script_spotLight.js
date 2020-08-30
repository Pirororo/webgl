//点光源 (平行光源ではない)
//vboとIboのバインドはdraw内でやってるけどこれはモデルが２つあるからで、１つならこれまで同様draw内でなくてもよい〜
//明るくするにはhtmlのdiffuseを +0.2 底上げする
//頂点の位置情報は、通常ローカル座標として頂点シェーダに渡されます。ですから、たとえばモデル座標変換でモデルを移動したり回転させたりしていた場合、頂点の位置は変わってしまいますね。ローカル座標系では(1.0, 1.0, 1.0)にあった頂点であっても、移動や回転を行なったことによって別の座標(たとえば 0.5, 2.0, 5.5 とか)へと変換されている可能性があるわけです。
//点光源から発された光のライトベクトルは、このモデル座標変換を行なったあとの頂点の位置を考慮したものでなければなりません。ですから、頂点シェーダにはモデル座標変換行列を新たに渡す必要があります。


onload = function(){

    // チェックボックスの参照を取得
	var che_culling = document.getElementById('cull');
    var che_depth_test = document.getElementById('depth');
    


    //canvas 要素への参照を得る *****
    var c = document.getElementById("canvas");

    c.width = 500;
    c.height = 300;

    //コンテキストとは
    //webglコンテキストは
    //canvas 要素からコンテキストオブジェクトを取得するためのメソッドで、引数には文字列で取得したいコンテキストの名称を渡します。
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
    attLocation[1] = gl.getAttribLocation(prg, 'normal');
    attLocation[2] = gl.getAttribLocation(prg, 'color');
    // attributeの要素数(この場合は xyz の3要素)
    // attributeの要素数を配列に格納
    var attStride = new Array(3);
    attStride[0] = 3;
    attStride[1] = 3;
    attStride[2] = 4;

    // モデルデータを用意 *****
    var torusData = torus(64, 64, 0.5, 1.5, [0.75, 0.25, 0.25, 1.0]);
    var sphereData = sphere(64, 64, 2.0, [0.25, 0.25, 0.75, 1.0]);

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
    uniLocation[4] = gl.getUniformLocation(prg, 'eyeDirection');//目線の方向
    uniLocation[5] = gl.getUniformLocation(prg, 'ambientColor');//環境光の色



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
    //  視点ベクトルの向き
    var eyeDirection = [0.0, 0.0, 20.0];
    // 環境光の色
    var ambientColor = [0.1, 0.1, 0.1, 1.0];//アルファ1.0

    // ビュー×プロジェクション座標変換行列
    // m.lookAt([0.0, 0.0, 3.0], [0, 0, 0], [0, 1, 0], vMatrix);
    m.lookAt(eyeDirection, [0, 0, 0], [0, 1, 0], vMatrix);
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

        //まずはトーラス

        // カウンタを元にラジアンと各種座標を算出
        var rad = (count % 360) * Math.PI / 180;
        var tx = Math.cos(rad) * 3.5;
        var ty = Math.sin(rad) * 3.5;
        var tz = Math.sin(rad) * 3.5;

        // トーラスのVBOとIBOをセット   ************
        set_attribute(tVBOList, attLocation, attStride);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndex);

        // トーラスのモデル座標変換行列の生成
		m.identity(mMatrix);
        m.translate(mMatrix, [tx, -ty, -tz], mMatrix);
        m.rotate(mMatrix, rad, [1, 1, 0], mMatrix);
        m.multiply(tmpMatrix, mMatrix, mvpMatrix);
        m.inverse(mMatrix, invMatrix);

        gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
        gl.uniformMatrix4fv(uniLocation[1], false, mMatrix);
        gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
        gl.uniform3fv(uniLocation[3], lightPosition);
        gl.uniform3fv(uniLocation[4], eyeDirection);
        gl.uniform4fv(uniLocation[5], ambientColor);

        //この第二引数は生の配列を入れる。生成したvboのtIndexでは真っ暗になる。
        gl.drawElements(gl.TRIANGLES, torusData.i.length, gl.UNSIGNED_SHORT, 0);

        //次にスフィア
        //スフィアのVBOとIBOをセット
        set_attribute(sVBOList, attLocation, attStride);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sIndex);

        // スフィアのモデル座標変換行列の生成
		m.identity(mMatrix);
        m.translate(mMatrix, [-tx, ty, tz], mMatrix);
        m.rotate(mMatrix, rad, [1, 1, 0], mMatrix);
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

    //HSV から RGB への変換を行なう関数
    function hsva(h, s, v, a){
        if(s > 1 || v > 1 || a > 1){return;}
        var th = h % 360;
        var i = Math.floor(th / 60);
        var f = th / 60 - i;
        var m = v * (1 - s);
        var n = v * (1 - s * f);
        var k = v * (1 - s * (1 - f));
        var color = new Array();
        if(!s > 0 && !s < 0){
            color.push(v, v, v, a); 
        } else {
            var r = new Array(v, n, m, m, k, v);
            var g = new Array(k, v, v, n, m, m);
            var b = new Array(m, m, k, v, v, n);
            color.push(r[i], g[i], b[i], a);
        }
        return color;
    }

    function torus(row, column, irad, orad, color){
        var pos = new Array(), nor = new Array(), col = new Array(), idx = new Array();
        for(var i = 0; i <= row; i++){
            var r = Math.PI * 2 / row * i;
            var rr = Math.cos(r);
            var ry = Math.sin(r);
            for(var ii = 0; ii <= column; ii++){
                var tr = Math.PI * 2 / column * ii;
                var tx = (rr * irad + orad) * Math.cos(tr);
                var ty = ry * irad;
                var tz = (rr * irad + orad) * Math.sin(tr);
                var rx = Math.cos(tr);
                var rz = Math.sin(tr);
                if(color){
					var tc = color;
				}else{
					tc = hsva(360 / column * ii, 1, 1, 1);
				}
                pos.push(tx, ty, tz);
                nor.push(rx, ry, rz);
                col.push(tc[0], tc[1], tc[2], tc[3]);
            }
        }
        for(i = 0; i < row; i++){
            for(ii = 0; ii < column; ii++){
                r = (column + 1) * i + ii;
                idx.push(r, r + column + 1, r + 1);
                idx.push(r + column + 1, r + column + 2, r + 1);
            }
        }
        // return [pos, nor, col, idx];
        return {p : pos, n : nor, c : col, i : idx};
    }

    // 球体を生成する関数
function sphere(row, column, rad, color){//緯度//経度//半径
    var pos = new Array(), nor = new Array(),
        col = new Array(), idx = new Array();
    for(var i = 0; i <= row; i++){
        var r = Math.PI / row * i;
        var ry = Math.cos(r);
        var rr = Math.sin(r);
        for(var ii = 0; ii <= column; ii++){
            var tr = Math.PI * 2 / column * ii;
            var tx = rr * rad * Math.cos(tr);
            var ty = ry * rad;
            var tz = rr * rad * Math.sin(tr);
            var rx = rr * Math.cos(tr);
            var rz = rr * Math.sin(tr);
            if(color){
                var tc = color;
            }else{
                tc = hsva(360 / row * i, 1, 1, 1);
            }
            pos.push(tx, ty, tz);
            nor.push(rx, ry, rz);
            col.push(tc[0], tc[1], tc[2], tc[3]);
        }
    }
    r = 0;
    for(i = 0; i < row; i++){
        for(ii = 0; ii < column; ii++){
            r = (column + 1) * i + ii;
            idx.push(r, r + 1, r + column + 2);
            idx.push(r, r + column + 2, r + column + 1);
        }
    }
    return {p : pos, n : nor, c : col, i : idx};
}



}

