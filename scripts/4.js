AFRAME.registerComponent('soundcontroller', {
    init: function(){
        let el = this.el;
        el.addEventListener('click', function(ev){
            let id = ev.srcElement.id;
            console.log(`%c${id}`, "font-size: 2em")
            let music = document.querySelector("#music");
            if(id == "play"){
                music.components.sound.playSound();
            } else if (id == "pause") {
                music.components.sound.pauseSound();
            } else {
                music.components.sound.stopSound();
            }
        })
        

    }

});