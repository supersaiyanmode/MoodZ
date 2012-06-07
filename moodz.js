var tweetColorMap = {
    get: function(tweet, fn){
        chrome.extension.sendRequest(tweet, fn);
    }
};

function getTweets(){
    var array = [],
        streamContainter = $('#stream-items-id'),
        children = streamContainter.children(),
        x, curChild;
    
    for (x in children){
        curChild = children[x];
        if (curChild.getElementsByClassName){
            array.push({
                text:curChild.getElementsByClassName('js-tweet-text')[0].innerText,
                container:curChild,
                id:$(curChild).data('item-id')
            });
        }
    }
    
    streamContainter = $('.recent-tweets');
    children = streamContainter.children();
    
    for (x in children){
//         curChild = children[x];
//         var obj = {container:curChild};
//         obj.id = $(curChild).data('tweet-id');
//         obj.text = $($(curChild).find('.js-tweet-text')[0]).text();
//         array.push(obj);
    }
    return array;
}
function getColorByScore(score){
    var color = "#", diff = 60,t;
    if (score <0){
        t = (230-Math.round(-score * diff)).toString(16);
        color += "FF" + t + t;
    }else{
        t = (230-Math.round(score * diff)).toString(16);
        color += t + "FF" +  t;
    }
    return color;
}
function animateScore(obj, score){
    if (!score || isNaN(score))
        return;
    var color = getColorByScore(score);
    $(obj).css("-webkit-transition","all 2.6s ease")
        .css("backgroundColor","white")
        .css("backgroundColor",color)
        .delay(200).queue(function() {
            $(this).dequeue();
        }); 
    console.log($(obj).find('.js-tweet-text')[0].innerText.substring(0,20) + ": " +
                color + "("+score+")");
}
function paintScore(obj, score){
    if (!score || isNaN(score))
        return;
    $(obj).css("backgroundColor",getColorByScore(score));
}
function refreshMood(){
    $.each(getTweets(), function(index, value){
        //Check if exists in the tweetColorMap..
        tweetColorMap.get({id:value.id,text:value.text}, function(score){
            if (score){
                animateScore(value.container,score);
            }
        });
    });
}

function DOMModificationHandler(){
    $(this).unbind('DOMSubtreeModified.event1');
    setTimeout(function(){
        refreshMood();
        $('#stream-items-id').bind('DOMSubtreeModified.event1',DOMModificationHandler);
    },1000);
}

$(function(){
    $(document).click(function(){setTimeout(refreshMood,1000);});
    $('#stream-items-id').bind('DOMSubtreeModified.event1',DOMModificationHandler);
    $('.twttr-dialog-wrapper').bind('DOMSubtreeModified.event2',DOMModificationHandler);
    refreshMood();
});