function findElement(win, id){

    try{

        var el = win.document.getElementById(id);

        if(el){
            return el;
        }

        var iframes = win.document.querySelectorAll("iframe");

        for(var i=0;i<iframes.length;i++){

            try{

                var result = findElement(
                    iframes[i].contentWindow,
                    id
                );

                if(result){
                    return result;
                }

            }catch(e){}
        }

    }catch(e){}

    return null;
}

function clickNew(win){

    try{

        var btn = win.document.querySelector(
            "oj-button#New button"
        );

        if(btn){

            btn.click();

            console.log("NEW CLICKED");

            return true;
        }

        var iframes = win.document.querySelectorAll("iframe");

        for(var i=0;i<iframes.length;i++){

            try{

                if(
                    clickNew(
                        iframes[i].contentWindow
                    )
                ){
                    return true;
                }

            }catch(e){}
        }

    }catch(e){}

    return false;
}

function setValue(id,value){

    var el = findElement(window,id);

    if(!el){
        console.log("NOT FOUND:",id);
        return false;
    }

    el.focus();

    var nativeSetter =
        Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            "value"
        ).set;

    nativeSetter.call(el,value);

    el.dispatchEvent(
        new Event("input",{bubbles:true})
    );

    el.dispatchEvent(
        new Event("change",{bubbles:true})
    );

    el.blur();

    console.log("FILLED:",id);

    return true;
}

clickNew(window);

var waitCount = 0;

var timer = setInterval(function(){

    var userId = findElement(
        window,
        "BLK_USER__USER_ID|input"
    );

    if(
        userId &&
        !userId.disabled &&
        !userId.readOnly
    ){

        clearInterval(timer);

        setValue(
            "BLK_USER__USER_ID|input",
            "TESTUSER"
        );

        setValue(
            "BLK_USER__USER_NAME|input",
            "TEST USER"
        );

        setTimeout(function(){

            setValue(
                "BLK_USER__HOME_ENTITY|input",
                "ENTITY_ID1"
            );

            setTimeout(function(){

                setValue(
                    "BLK_USER__USER_PASSWORD|input",
                    "Password@123"
                );

                console.log("DONE");

            },1500);

        },500);
    }

    waitCount++;

    if(waitCount > 100){

        clearInterval(timer);

        console.log(
            "TIMEOUT WAITING FOR USER ID"
        );
    }

},200);