$(function(){
	$("a").bind('click',function(e){
		e.preventDefault();
		var href = $(this).attr("href");
		var title = $(this).attr("title")
		Bridge.openMobileWindow(href, title, function (result) {});
	});
});
