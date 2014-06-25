/*
    For June 26, 2014 talk.
*/

   registerGlyph("cup()", [

      // TEMPLATE TO MATCH FOR THE FREEHAND SKETCH OF THE COFFEE CUP.

      [ [ -1,-1 ], [ -1,1 ], [ 1,1 ], [1,-1 ] ],    // SIDES AND BOTTOM.
      [ [ 1,-1], [-1,-1], [1,-1] ],                 // TOP.
      makeOval(-1.6,-.6, 1.2, 1.2, 20, PI/2, 3*PI/2),      // OUTER HANDLE.
      makeOval(-1.4,-.4, 0.8, 0.8, 20, PI/2, 3*PI/2),      // INNER HANDLE.
   ]);

   function cup() {
      var node = root.addNode();

      // THE BODY OF THE CUP IS A HOLLOW TAPERED CYLINDER.

      var body = node.addLathe( [
         [ 0.00, 0, -1.00],
         [ 0.90, 0, -1.00],
         [ 1.00, 0, -0.90],
         [ 1.00, 0,  1.00],
         [ 0.90, 0,  1.00],
         [ 0.90, 0, -0.90],
         [ 0.00, 0, -0.90],
      ], 32);

      // THE HANDLE STICKS INTO THE CUP. WE DON'T CARE SINCE THAT PART IS COVERED BY THE COFFEE.

      var handle = node.addTorus(.3, 8, 24);
      handle.getMatrix().translate(-1,0,0).rotateX(PI/2).scale(.5);

      var coffee = node.addCylinder();
      coffee.getMatrix().translate(0,0,.9).scale(.95,.95,.01);

      node.setMaterial(whiteMaterial);
      coffee.setMaterial(new phongMaterial().setAmbient(.07,0,0));

      var sketch = geometrySketch(node, [0.1,0,0,-PI/2,0.9]);
      sketch.swirlMode = -1;

      sketch.coffee = coffee;

      sketch.mouseDrag = function() { }
      sketch.onSwipe = function(dx, dy) {
         this.swirlMode = pieMenuIndex(dx, dy);
         this.swirlStartTime = time;
         switch (this.swirlMode) {
         case 0:
            this.cream = [];
            for (var i = 0 ; i < 100 ; i++) {
               var t = i / 100;
               this.cream.push( [ lerp(t, -1, 1) , 0 ] );
            }
            break;
         }
      }

      sketch.update = function(elapsed) {

         if (this.swirlMode == 0) {
            var x0 = (this.xlo + this.xhi) / 2;
            var y0 = (this.ylo + this.yhi) / 2;
            var r  = (this.xhi - this.xlo) / 2;

            var dt = .25 * (time - this.swirlStartTime);
            if (dt > 5)
               dt = 5 + .1 * (dt - 5);

            var fade = 1 - sCurve(max(0, 1 - dt / 5.5));

            var freq = pow(2, dt/1.5);
            var eps = .01;

            for (var i = 0 ; i < this.cream.length ; i++) {
               var cx = this.cream[i][0];
               var cy = this.cream[i][1];

               var n00 = .2 * noise2(freq * cx      , freq * cy       + 180);
               var n10 = .2 * noise2(freq * cx + eps, freq * cy       + 180);
               var n01 = .2 * noise2(freq * cx      , freq * cy + eps + 180);

               var dx = (n01 - n00) / eps;
               var dy = (n00 - n10) / eps;

               cx += elapsed * dx;
               cy += elapsed * dy;

               var rr = cx * cx + cy * cy;
               var f = lerp(1 - rr, .995, 1);
               cx *= f;
               cy *= f;

               this.cream[i][0] = cx;
               this.cream[i][1] = cy;
            }

            function fillIn(a, eps) {
               for (var i = 0 ; i < a.length - 1 ; i++) {

                  var x0 = a[i  ][0];
                  var y0 = a[i  ][1];

                  var x1 = a[i+1][0];
                  var y1 = a[i+1][1];

                  if (len(x1 - x0, y1 - y0) > 0.1) {
                     var midpoint = [ (x0 + x1) / 2, (y0 + y1) / 2 ];

                     var A = a.slice(0, i+1);
                     var B = [ midpoint ];
                     var C = a.slice(i+1, a.length);

                     a = A.concat(B);
                     a = a.concat(C);

                     i++;
                  }
               }
               return a;
            }

            if (dt < 4.5)
               this.cream = fillIn(this.cream, 0.1);

            _g.save();
            _g.lineWidth = (this.xhi - this.xlo) * lerp(fade * fade, .0025, .005);
            _g.strokeStyle = 'rgba(255,255,255,' + (1-fade) + ')';
            _g.beginPath();

            var scale = lerp(dt/5, .55, .75), xPrev = 0, yPrev = 0;
            for (var i = 0 ; i < this.cream.length ; i++) {
               var x = x0 + r * this.cream[i][0] * scale;
               var y = y0 + r * this.cream[i][1] * scale;
               if (i == 0 /* || len(x-xPrev,y-yPrev) > 20 */)
                  _g.moveTo(x, y);
               else if (i/this.cream.length < dt)
                  _g.lineTo(x, y);
               xPrev = x;
               yPrev = y;
            }

            sketch.coffee.setMaterial(new phongMaterial().setAmbient(lerp(fade*fade,.07,.16),0,0));

            _g.stroke();
            _g.restore();
         }
      }
   }

   function Noises() {
      this.labels = "noise1D absns1D".split(' ');

      this.freqs = [1];
      this.mode = "none";
      this.mouseX = 0;
      this.mouseY = 0;
      this.t0 = 0;

      this.hitOnUp = function(sketch) {
         if (sketch instanceof Noises) {
            this.freqs = this.freqs.concat(sketch.freqs);
            deleteSketch(sketch);
         }
      }

      this.mouseDrag = function(x, y) {
         if (isDef(this.dragX))
            this.t0 -= 2 * (x - this.dragX) / (this.xhi - this.xlo);
         this.dragX = x;
      }

      this.onSwipe = function(dx, dy) {
         var mode = pieMenuIndex(dx, dy);
         if (mode == 1 || mode == 3)
            for (var n = 0 ; n < this.freqs.length ; n++)
               this.freqs[n] *= (mode == 1 ? 2 : 0.5);
      }

      this.render = function(elapsed) {
         m.save();
            m.scale(this.size / 350);

            color(140,140,140);
            mLine([-1,0],[1,0]);
            color(this.color);

            var maxFreq = 1;
            for (var n = 0 ; n < this.freqs.length ; n++)
               maxFreq = max(maxFreq, this.freqs[n]);
            var stepSize = 0.1 / maxFreq;

            var c = [];
            for (var t = -1 ; t < 1 + stepSize ; t += stepSize) {
               if (t > 1)
                  t = 1;
               var signal = 0;
               for (var n = 0 ; n < this.freqs.length ; n++) {
                  var freq = this.freqs[n];
                  var f = noise2((this.t0 + t) * freq, 200 * freq) / freq;
                  signal += this.selection == 1 ? abs(f) : f;
               }
               c.push([t, signal]);
            }
            mCurve(c);

         m.restore();
      }
   }
   Noises.prototype = new Sketch;

/*
   Things to work on:
           DONE Coffee cup:
                profile view morphs into
                3/4 view morphs into
                top view.
                Pour line of cream.
                Swirling cream folds over.
                Swirls more then folds over a second time.
                Mention Feigenbaum,onset of turbulence and powers of two.
        Marble principle
                show stripes (show code for this)
                add phase shift (show code for this)
                use turbulence instead of fractal sum.
        Add gesture to set to a particular page (with its attendant sketch definitions).
        Flame -> corona
        Clouds
        Smoke
        Principle of endless cycle for noise.
        List of movies.
        nVideo, etc., -> WebGL
        Animated creature:  Add noise to movement.
        Trees waving in the wind.
                - build as a fractal.
                - add noise to each node (show code).
        Slice through a 3D block.
        To make a marble vase:
                - draw a contour.
                - draw a circle.
                - drag circle to contour to create 3D shape.
                - add texture (show code).
*/

var planetFragmentShader = ["\
   void main(void) {\n\
      float z = sqrt(1.-x*x-y*y);\n\
      float cRot = cos(.2*time), sRot = sin(.2*time);\n\
      float cVar = cos(.1*time), sVar = sin(.1*time);\n\
      vec3 pt = vec3(cRot*x+sRot*z+cVar, y, -sRot*x+cRot*z+sVar);\n\
      float g = turbulence(pt);                      /* CLOUDS */\n\
      vec2 v = .6 * vec2(x,y);                       /* SHAPE  */\n\
      float d = 1. - 4.1 * dot(v,v);\n\
      float s = .3*x + .3*y + .9*z; s *= s; s *= s;  /* LIGHT  */\n\
      d = d>0. ? .1+.05*g+.6*(.1+g)*s*s : d>-.1 ? d+.1 : 0.;\n\
      float f = -.2 + sin(4. * pt.x + 8. * g + 4.);  /* FIRE   */\n\
      f = f > 0. ? 1. : 1. - f * f * f;\n\
      if (d <= 0.1)\n\
         f *= (g + 5.) / 3.;\n\
      vec3 color = vec3(d*f*f*.85, d*f, d*.7);       /* COLOR  */\n\
      gl_FragColor = vec4(color,alpha*min(1.,10.*d));\n\
   }\
"].join("\n");

registerGlyph("planet()",[
   makeOval(-1, -1, 2, 2, 32,PI/2,5*PI/2),                // OUTLINE PLANET CCW FROM TOP.
   [ [0,-1], [-1/2,-1/3], [1/2,1/3], [0,1] ], // ZIGZAG DOWN CENTER, FIRST LEFT THEN RIGHT.
]);

function planet() {
   var sketch = addPlaneShaderSketch(defaultVertexShader, planetFragmentShader);
   sketch.code = [
      [ "", planetFragmentShader ],
   ];
}

var marbleFragmentShader = ["\
   void main(void) {\
      float t = value == 3. ? .7 * noise(vec3(x,y,0.)) :\
                value == 4. ? .5 * fractal(vec3(x,y,5.)) :\
                value == 5. ? .4 * (turbulence(vec3(x*1.5,y*1.5,10.))+1.8) :\
		              .0 ;\
      float s = .5 + .5*cos(7.*x+6.*t);\
      if (value == 2.) \
         s = .5 + noise(vec3(3.*x,3.*y,10.));\
      else if (value > 0.)\
         s = pow(s, .1);\
      vec3 color = vec3(s,s*s,s*s*s);\
      gl_FragColor = vec4(color,alpha);\
   }\
"].join("\n");

registerGlyph("marble()",[
   [ [-1,-1],[1,-1],[1,1],[-1,1],[-1,-1] ],    // SQUARE OUTLINE CW FROM TOP LEFT.
   [ [-1/3,-1], [-1/3,1] ],
   [ [ 1/3,-1], [ 1/3,1] ],
]);

function marble() {
   var sketch = addPlaneShaderSketch(defaultVertexShader, marbleFragmentShader);
   sketch.code = [
      ["stripe", "sin(x)"],
      ["pinstripe", "pstripe(x) = pow(sin(x), 0.1)"],
      ["noise", ".5 + .5 * noise(x,y,z))"],
      ["add noise", "pstripe(x + noise(x,y,z))"],
      ["add fractal", "pstripe(x + fractal(x,y,z))"],
      ["add turbulence", "pstripe(x + turbulence(x,y,z))"],
   ];
}


var coronaFragmentShader = ["\
   void main(void) {\
      float a = .7;\
      float b = .72;\
      float s = 0.;\
      float r0 = sqrt(x*x + y*y);\
      if (r0 > a && r0 <= 1.) {\
         float r = r0;\
         if (value == 2.)\
            r = min(1., r + 0.2 * turbulence(vec3(x,y,0.)));\
         else if (value == 3.) {\
            float ti = time*.3;\
            float t = mod(ti, 1.);\
            float u0 = turbulence(vec3(x*(2.-t)/2., y*(2.-t)/2., .1* t    +2.));\
            float u1 = turbulence(vec3(x*(2.-t)   , y*(2.-t)   , .1*(t-1.)+2.));\
            r = min(1., r - .1 + 0.3 * mix(u0, u1, t));\
         }\
         s = (1. - r) / (1. - b);\
      }\
      if (r0 < b)\
         s *= (r0 - a) / (b - a);\
      vec3 color = vec3(s);\
      if (value >= 1.) {\
         float ss = s * s;\
         color = s*vec3(1.,ss,ss*ss);\
      }\
      gl_FragColor = vec4(color,alpha*s);\
   }\
"].join("\n");

registerGlyph("corona()",[
   makeOval(-.5, -.5, 1, 1, 32,PI/2,5*PI/2),              // INNER LOOP CCW FROM TOP.
   makeOval(-1, -1, 2, 2, 32,PI/2,5*PI/2),                // OUTER LOOP CCW FROM TOP.
]);

function corona() {
   var sketch = addPlaneShaderSketch(defaultVertexShader, coronaFragmentShader);
   sketch.code = [
      ["radial", "r = radius(x,y)"],
      ["color grad", "grad(r)"],
      ["turbulence", "grad(r + turbulence(P))"],
      ["animate", "grad(r + turbulence(P(time)))"],
   ];
}


var slicedFragmentShader = ["\
   uniform float spinAngle;\
   void main(void) {\
      float rr = x*x + y*y;\
      float z = rr >= 1. ? 0. : sqrt(1. - rr);\
      float dzdx = -1.3;\
      float zp = dzdx * (x - mx * 1.3 + .3);\
      if (zp < -z)\
         rr = 1.;\
      vec3 color = vec3(0.);\
      if (rr < 1.) {\
         vec3 nn = vec3(x, y, z);\
         if (zp < z) {\
            z = zp;\
            nn = normalize(vec3(-dzdx,0.,1.));\
         }\
         float s = rr >= 1. ? 0. : .3 + max(0., dot(vec3(.3), nn));\
         float X =  x * cos(spinAngle) + z * sin(spinAngle);\
         float Y =  y;\
         float Z = -x * sin(spinAngle) + z * cos(spinAngle);\
         vec3 P = vec3(.9*X,.9*Y,.9*Z + 8.);\
         float tu = ( value>1. ? noise(P) : turbulence(P) );\
         float c = pow(.5 + .5 * sin(7. * X + 4. * tu), .1);\
         color = vec3(s*c,s*c*c*.6,s*c*c*c*.3);\
         if (nn.x > 0.) {\
            float h = .2 * pow(dot(vec3(.67,.67,.48), nn), 20.);\
            color += vec3(h*.4, h*.7, h);\
         }\
         else {\
            float h = .2 * pow(dot(vec3(.707,.707,0.), nn), 7.);\
            color += vec3(h, h*.8, h*.6);\
         }\
      }\
      gl_FragColor = vec4(color,alpha);\
   }\
"].join("\n");

registerGlyph("sliced()",[
   makeOval(-1, -1, 2, 2, 32,  PI*0.5, PI*2.5),
   makeOval( 0, -1, 1, 1, 32,  PI*0.5, PI*2.0),
]);

function sliced() {
   var sketch = addPlaneShaderSketch(defaultVertexShader, slicedFragmentShader);
   sketch.mouseDrag = function(x, y) {}
   sketch.spinRate = 0;
   sketch.spinAngle = 0;
   sketch.onClick = function() {
      this.spinRate = -1 - this.spinRate;
   }
   sketch.update = function(elapsed) {
      this.setUniform('spinAngle', this.spinAngle += elapsed * this.spinRate);
   }
}


function Grid() {
   this.labels = "grid".split(' ');
   this.gridMode = -1;
   this.is3D = true;
   this.onSwipe = function(dx, dy) {
      this.gridMode = pieMenuIndex(dx, dy);
   }
   this.render = function(elapsed) {
      var f = 2/3;
      m.save();
         m.scale(this.size / 400);
         if (this.gridMode != 3) {
            mCurve([[-1,0], [1, 0]]);
            mCurve([[ 0,1], [0, -1]]);
            mCurve([[-1, f], [1, f]]);
            mCurve([[-1,-f], [1,-f]]);
            mCurve([[-f,1], [-f,-1]]);
            mCurve([[ f,1], [ f,-1]]);
         }
         this.afterSketch(function() {
            var uColor = 'rgb(255,64,64)';
            var vColor = 'rgb(64,255,64)';
            switch (this.gridMode) {
            case 3:
            case 2:
               var d = 1/20;
               var e = d/2;
               lineWidth(0.5);
               for (var u = -1 ; u <= 1 + d/2 ; u += d)
               for (var v = -1 ; v <= 1 + d/2 ; v += d) {
                  var t0 = noise2(u  , v  )*f;
                  var tu = noise2(u+d, v  )*f;
                  var tv = noise2(u  , v+d)*f;
                  if (u < 1) {
                     color(uColor);
                     mCurve([[u*f,v*f,t0] , [(u+d)*f,v*f,tu]]);
                  }
                  if (v < 1) {
                     color(vColor);
                     mCurve([[u*f,v*f,t0] , [u*f,(v+d)*f,tv]]);
                  }
               }
               if (this.gridMode == 3)
                  break;
            case 1:
               lineWidth(4);
               color(vColor);
               for (var u = -1 ; u <= 1 ; u += 1)
               for (var v = -1 ; v <= 1 ; v += 1) {
                  var t0 = noise2(u, v    );
                  var t1 = noise2(u, v+.01);
                  var s = .1 * (t1 - t0) / .01;
                  mCurve([[u*f,v*f-.1,-s] , [u*f,v*f+.1,s]]);
               }
            case 0:
               lineWidth(4);
               color(uColor);
               for (var u = -1 ; u <= 1 ; u += 1)
               for (var v = -1 ; v <= 1 ; v += 1) {
                  var t0 = noise2(u    , v);
                  var t1 = noise2(u+.01, v);
                  var s = .1 * (t1 - t0) / .01;
                  mCurve([[u*f-.1,v*f,-s] , [u*f+.1,v*f,s]]);
               }
               break;
            }
         });
      m.restore();
   }
}
Grid.prototype = new Sketch;

