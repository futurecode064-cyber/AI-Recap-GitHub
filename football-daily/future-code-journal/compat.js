/* Android System WebView 80–85 does not implement ParentNode.replaceChildren. */
(function(){
 function replaceChildren(){
  var nodes=[];
  for(var i=0;i<arguments.length;i++)nodes.push(typeof arguments[i]==='string'?document.createTextNode(arguments[i]):arguments[i]);
  while(this.firstChild)this.removeChild(this.firstChild);
  for(var j=0;j<nodes.length;j++)this.appendChild(nodes[j]);
 }
 [Element.prototype,Document.prototype,DocumentFragment.prototype].forEach(function(proto){
  if(!proto.replaceChildren)Object.defineProperty(proto,'replaceChildren',{configurable:true,writable:true,value:replaceChildren});
 });
})();
