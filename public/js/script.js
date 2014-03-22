!(function() {
	var flash = document.querySelector('.flash');
	if(flash){
		setTimeout(function(){
			flash.parentNode.removeChild(flash);
		}, 3000);
	}
})();