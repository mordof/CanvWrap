CanvWrap=function(id,width,height){

	var canv=null,
		canvctx=null,
		rt=new RTree(),
		layers={'main':0},
		track_mouse=false,
		old_results = []; // Holds old mousing elements (for mouseMove)
		
	canv=document.getElementById(id);
	canv["x"] = 0; canv["y"] = 0;
	canv["w"] = canv.width;	canv["h"] = canv.height;
	
	canv.addEvent=function(type,func){
		if(canv.addEventListener)
			canv.addEventListener(type,func,false);
		else if(canv.attachEvent)
			canv.attachEvent(type,func);
	};
	
	window.addEvent=function(type,func){
		if(window.addEventListener)
			window.addEventListener(type,func,false);
		else if(window.attachEvent)
			window.attachEvent(type,func);
	};
	
	canv.addEvent('mousedown',__mouseDown);
	canv.addEvent('mouseup',__mouseDown);
	canv.addEvent('click',__mouseDown);
	canv.addEvent('dblclick',__mouseDown);
	
	if(canv.getContext)
		canvctx=canv.getContext('2d');
		
	// This needs to be created into a public function for AddObject, not events
	/*
	this.insertIndex=function(bounds,id,action,func,layer)
	{
		if(!func) return;
		if(!layer) layer='main';
		
		// Get all overlapping objects from the tree
		var local_objs = treeSearch(bounds);
		var new_obj = true;

		// Look for an existing object with our same ID
		while(local_objs.length > 0)
		{
			obj = local_objs.pop();
			if(obj.id == id)
			{
				new_obj = false;
				break;
			}
		}
		// If no object was found, make a new one...
		if(new_obj) obj = {"func":{}, "action":{}, "bounds":{}, "id":id};
		
		// If no events have been attached to the canvas, attach them..
		
		
		// this happens in the addObject to the wrapper, the rest happens inside the objects themselves
		if((action=='mouseover' || action=='mouseout' || action=='mousemove') && !track_mouse)
		{
			track_mouse=true;
			window.addEvent('mousemove',__mouseMove);
		}

		// Update our obj's properties
		obj.func[action] = func;
		obj.bounds[action] = bounds;
		obj.action[action] = true;
		obj.layer = layers[layer];
		if(new_obj) rt.insert(bounds,obj);
	}*/
	
	this.addObject=function(obj)
	{
		if(!obj.getNode())
			return false;
		
		var node=obj.getNode();
		
		if(!track_mouse)
			for(var act in node.action)
			{
				switch(act)
				{
					case 'mouseover':
					case 'mouseout':
					case 'mousemove':
						track_mouse=true;
						window.addEvent('mousemove',__mouseMove);
						break;
				}
				if(track_mouse)
					break;
			}
		
		rt.insert(node.bounds, obj);
	}

	function treeSearch(rect)
	{
		var results=rt.search(rect);
		if(results.length==0)
			return [];
		results.sort(sortRes);
		return results;
	}
	
	function sortRes(a,b){ return b.getNode().layer-a.getNode().layer; }
		
	function __mouseDown(e){
		var xy=getXY(e),
			results=treeSearch(xy);
		for(var i=0;i<results.length;i++)
		{
			var node=results[i].getNode();
			if(node.action[e.type])
			{
				var ev={targetX:node.bounds[e.type].x,
						targetY:node.bounds[e.type].y,
						targetWidth:node.bounds[e.type].w,
						targetHeight:node.bounds[e.type].h,
						x:xy.x,
						y:xy.y,
						action:e.type,
						pageX:xy.pageX,
						pageY:xy.pageY}
				node.func[e.type].call(results[i], ev);
			}
		}
	}

	// SET_NOT returns an array containing all elements in A that are NOT IN B
	function SET_NOT(A, B)
	{
		var a_len = A.length, b_len = B.length;
		var ret_array = [], a_found_in_b = false;
		for(var ai = 0; ai < a_len; ai++)	{
			for(var bi = 0; bi < b_len; bi++)	{
				if(A[ai] === B[bi])
					a_found_in_b = true;
			}
			if(!a_found_in_b)
				ret_array.push(A[ai]);
			a_found_in_b = false;
		}
		return(ret_array);
	}
	
	function __mouseMove(e){
		var xy=getXY(e),
			l_results=RTree.Rectangle.overlap_rectangle(xy, canv)?treeSearch(xy):[],
			l_mouse_outs =  SET_NOT(old_results, l_results), 
			l_mouse_ins = SET_NOT(l_results, old_results);
		old_results = l_results.splice(0, l_results.length);

		while(l_mouse_outs.length>0)
		{
				var thrown=l_mouse_outs.pop();
				var node=thrown.getNode();
				if(node.action['mouseout'])
				{
					var ev={targetX:node.bounds.x,
							targetY:node.bounds.y,
							targetWidth:node.bounds.w,
							targetHeight:node.bounds.h,
							x:xy.x,
							y:xy.y,
							action:'mouseout',
							pageX:xy.pageX,
							pageY:xy.pageY}
					node.func['mouseout'].call(thrown, ev);
				}
		}
		while(l_mouse_ins.length>0)
		{
				var thrown=l_mouse_ins.pop();
				var node=thrown.getNode();
				if(node.action['mouseover'])
				{
					var ev={targetX:node.bounds.x,
							targetY:node.bounds.y,
							targetWidth:node.bounds.w,
							targetHeight:node.bounds.h,
							x:xy.x,
							y:xy.y,
							action:'mouseover',
							pageX:xy.pageX,
							pageY:xy.pageY}
					node.func['mouseover'].call(thrown, ev);
				}
		}
		while(l_results.length>0)
		{
				var thrown=l_results.pop();
				var node=thrown.getNode();
				if(node.action['mousemove'])
				{
					var ev={targetX:node.bounds.x,
							targetY:node.bounds.y,
							targetWidth:node.bounds.w,
							targetHeight:node.bounds.h,
							x:xy.x,
							y:xy.y,
							action:'mousemove',
							pageX:xy.pageX,
							pageY:xy.pageY}
					node.func['mousemove'].call(thrown, ev);
				}
		}
	}
	
	function getXY(e)
	{
		var posx =0,
			posy =0,
			pageX=0,
			pageY=0;
			
		if (!e) var e = window.event;
		if (e.pageX || e.pageY) {
			posx = e.pageX;
			posy = e.pageY;
		}
		else if (e.clientX || e.clientY) {
			posx = e.clientX + document.body.scrollLeft
				+ document.documentElement.scrollLeft;
			posy = e.clientY + document.body.scrollTop
				+ document.documentElement.scrollTop;
		}
		pageX=posx;
		pageY=posy;
		posx=posx-canv.offsetLeft;
		posy=posy-canv.offsetTop;
		return {x:posx,y:posy,w:1,h:1,pageX:pageX,pageY:pageY};
	}
}

CanvWrap.bounds=function(x,y,w,h){ return {x:x,y:y,w:w,h:h}; };
CanvWrap.coords=function(bounds){ return [bounds.x,bounds.y,bounds.w,bounds.h]; };

CanvasImage=function(image,id,layer,b1,b2){
	var nodeObj={"func":{}, "action":{}, "bounds":{}, "id":id, "layer":layer?layer:'main'},
		drawObj={type:0},
		b1=b1,
		b2=b2;

	// Methods to set up / initialize the object.
	this.setBounds=function(bounds1,bounds2)
	{
		if(bounds2)
		{
			if(bounds2.w && bounds2.h)
			{
				drawObj['type']=2;
				drawObj['source']=bounds2;
				drawObj['destination']=bounds1;
			}
		}
		else if(bounds1)
		{
			drawObj['type']=1;
			if(bounds1.w && bounds2.h)
				drawObj['destination']=bounds1;
			else
				drawObj['destination']=CanvWrap.bounds(bounds1.x,bounds1.y,drawObj['img'].width,drawObj['img'].height);
		}
		else
			return;
		
		nodeObj['bounds']=drawObj['destination']
		b1=bounds1;
		b2=bounds2;
	}
	this.setImage=function(img)
	{
		drawObj['img']=img;
		this.setBounds(b1,b2);
	}
	this.setLayer=function(layer)
	{
		nodeObj.layer=layer;
	}
	this.getNode=function()
	{
		return nodeObj;
	}
	this.addEvent=function(action,func)
	{
		if(!action || !func) return;
		nodeObj.func[action]=func;
		nodeObj.action[action]=true;
	}
	
	// REQUIRED: this.__draw(), necessary for all objects in order to be shown on the canvas.
	this.draw=function(ctx)
	{
		switch(drawObj.type)
		{
			case 1:
				var tmparr=[drawObj['img']];
				tmparr.push.apply(tmparr, CanvWrap.coords(drawObj['source']));
				tmparr.push.apply(tmparr, CanvWrap.coords(drawObj['destination']));
				ctx.drawImage.apply(ctx, tmparr);
				break;
			case 2:
				var tmparr=[drawObj['img']];
				tmparr.push.apply(tmparr, CanvWrap.coords(drawObj['destination']));
				ctx.drawImage.apply(ctx, tmparr);
				break;
		}
	}
	
	this.setLayer(layer);
	this.setImage(image);
	this.nodeType='CanvasIMG';
	this.toString=function(){ return '[CanvasImageElement]'; };
}

CanvasRect=function(id,layer,b1,col,type){
	var nodeObj={"func":{}, "action":{}, "bounds":{}, "id":id, "layer":layer?layer:'main'},
		drawObj={fillStyle:'black',strokeStyle:'black',drawStyle:1} // clear = 0, 1 = fill, 2 = stroke
		
	// Methods to set up / initialize the object.
	this.setBounds=function(bounds1)
	{
		if(bounds1)
		{
			drawObj['destination']=bounds1;
			nodeObj['bounds']=bounds1;
		}
	}
	this.setStyle=function(col,type)
	{
		switch(type)
		{
			case "clear":
				drawObj['drawStyle']=0;
				break;
			case "stroke":
				drawObj['strokeStyle']=col?col:'black';
				drawObj['drawStyle']=2;
				break;
			case "fill":
			default:
				drawObj['fillStyle']=col?col:'black';
				drawObj['drawStyle']=1;
				break;
		}
	}
	this.setLayer=function(layer)
	{
		nodeObj['layer']=layer;
	}
	this.getNode=function()
	{
		return nodeObj;
	}
	this.addEvent=function(action,func)
	{
		if(!action || !func) return;
		nodeObj.func[action]=func;
		nodeObj.action[action]=true;
	}
	
	// REQUIRED: this.draw(), necessary for all objects in order to be shown on the canvas.
	this.draw=function(ctx)
	{
		switch(drawObj.drawStyle)
		{
			case 0:
				ctx.clearRect.apply(ctx, CanvWrap.coords(nodeObj.bounds));
				break;
			case 1:
				ctx.fillStyle=drawObj.fillStyle;
				ctx.fillRect.apply(ctx, CanvWrap.coords(nodeObj.bounds));
				break;
			case 2:
				ctx.strokeStyle=drawObj.strokeStyle;
				ctx.strokeRect.apply(ctx, CanvWrap.coords(nodeObj.bounds));
				break;
		}
	}
	
	this.setLayer(layer);
	this.setBounds(b1);
	this.setStyle(col,type);
	this.nodeType='CanvasRect';
	this.toString=function(){ return '[CanvasRectangleElement]'; };
}
