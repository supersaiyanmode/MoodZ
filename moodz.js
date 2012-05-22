function getScore(text, resFn){
    $.ajax({
        url: url + encodeURIComponent(text),
        success: function(data, status, jqXHR){
            if (typeof(data)==typeof("")){
                data = JSON.parse(data);
            }
            if (data.status.toLowerCase()=="ok" && 'score' in data.docSentiment){
                resFn(1, parseFloat(data.docSentiment.score));
            }else{
                resFn(0, "");
            }
        }
    });
}

var tweetColorMap = {
    _port: 0,
    _cache: {},
    _idCallbackMap: {},
    
    _bgPort: function(){
        if (this._port === 0){
            this._port = chrome.extension.connect({name: "crap"});
            this._port.onMessage.addListener(function(msg){
                this._idCallbackMap[msg.id](msg);
            });
        }
        return this._port;
    },
    
    get: function(key, fn){
        if (key in this._cache)
            fn(1, this._cache[key]);
        else{
            this._idCallbackMap[key] = fn;
            this._bgPort().postMessage({key:key});
        }
    },
    
    set: function(key, value){
        this._cache[key] = value;
        this._getBackgroundPage().cache[key] = value;
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
    var key1 = "cbea409f98ab1834b4c9456803f1c1af0b0d7e9d"
    var key2 = "ff7a0501977740eeb2aed727bb35f3441c426d5a"
    var url = "http://access.alchemyapi.com/calls/text/TextGetTextSentiment?"+
        "apikey="+key2+"&"+
        "outputMode=json&text=";
    $.each(getTweets(), function(index, value){
        //Check if exists in the tweetColorMap..
        tweetColorMap.get(value.id, function(status,result){
            if (status === 1){
                paintScore(value.container, tweetColorMap[value.id].value);
            }else{
                getScore(value.text, function(status, result){
                    if (status === 1){
                        animateScore(value.container,score);
                        if ('id' in value){
                            tweetColorMap.set(value.id,score);
                        }
                    }
                });
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
})