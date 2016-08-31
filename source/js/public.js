$(function(){
	var height=$(window).height();
  	$(".mui-content").css("min-height",height);
	mui("body").on('tap','a',function(e){
		e.preventDefault();
		var href = $(this).attr("href");
		var title = $(this).attr("title");
		if(href){
			// Bridge.openMobileWindow(href, title, function (result) {});
			window.location.href=href;
		}
		else{
			mui.toast("建设中，敬请期待");
		}
	});
});
