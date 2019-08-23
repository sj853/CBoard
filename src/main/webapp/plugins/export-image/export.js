/**
 * 导出图片封装
 * 2019.08.22 liaoxx
 */
var exportImageHelper = {
    /**
     * 获取随机值
     * @returns {string} 随机值
     */
    random:function () {
        return Math.random().toString(36).substring(2);
    },
    /**
     * 获取工具栏html
     * @param key 键
     * @returns {string} 工具栏html
     */
    toolBar:function (key) {
        return "<div class='toolbar toolbar_" + key + "'>" +
            "<span class='exportPngBnt' title='" + cboardTranslate("DASHBOARD.CHART_EXPORT.PNG") + "'></span>" +
            "<span class='exportJpgBnt' title='" + cboardTranslate("DASHBOARD.CHART_EXPORT.JPG") + "'></span>" +
            "<span class='exportBmpBnt' title='" + cboardTranslate("DASHBOARD.CHART_EXPORT.BMP") + "'></span></div>";
    },
    /**
     * 构建导出事件
     * @param key 键
     * @param dom 导出图片的dom
     * @param name 图片的名字
     */
    buildButton:function (key, dom, name) {
        var _this = this;
        $(".toolbar_" + key + " .exportPngBnt").on('click', function () {
            _this.exportImage('png', dom, name);
        });
        $(".toolbar_" + key + " .exportJpgBnt").on('click', function () {
            _this.exportImage('jpg', dom, name);
        });
        $(".toolbar_" + key + " .exportBmpBnt").on('click', function () {
            _this.exportImage('bmp', dom, name);
        });
    },
    /**
     * 导出dom为图片
     * @param type 图片类型
     * @param dom 导出图片的dom
     * @param name 图片名字
     */
    exportImage:function (type, dom, name) {
        var _this = this;
        if (!name) {
            name = 'chart';
        }
        var canvas = dom.find('canvas');
        if (canvas && canvas.length > 0) {
            _this.getCanvasData(canvas[0], name, type);
        } else {
            var copyDom = $(dom).clone();
            var div = "<div id='divToImage' style='z-index:-1;position:absolute;top:0;left:0;width:" + $(dom).width() + "px;height:" + $(document).height() + "px;'></div>";
            $('body').append(div);
            var divDom = $('#divToImage');
            var top = document.documentElement.scrollTop || document.body.scrollTop
            copyDom.css('position', 'absolute');
            copyDom.css('top', top);
            copyDom.css('left', 0);
            divDom.append(copyDom);
            html2canvas(divDom[0], {
                height: $(dom).height(),
                y: top
            }).then(function(canvas) {
                _this.getCanvasData(canvas, name, type);
                divDom.remove();
            });
        }
    },
    /**
     * 获取canvas数据
     *
     * @param name 名称
     * @param canvas 画布
     * @param type 类型
     */
    getCanvasData:function(canvas, name, type) {
        var mimeType,suffix;
        switch (type) {
            case 'png':
                mimeType = 'image/png';
                suffix = '.png';
                break;
            case 'jpg':
                mimeType = 'image/jpeg';
                suffix = '.jpeg';
                break;
            case 'bmp':
                mimeType = 'image/bmp';
                suffix = '.bmp';
                break;
        }
        var w = canvas.width;
        var h = canvas.height;
        var context =  canvas.getContext("2d");
        var data = context.getImageData(0, 0, w, h);
        var compositeOperation = context.globalCompositeOperation;
        context.globalCompositeOperation = "destination-over";
        context.fillStyle = '#ffffff';
        context.fillRect(0,0, w, h);
        var pageData = canvas.toDataURL(mimeType);
        context.clearRect (0,0, w, h);
        context.putImageData(data, 0,0);
        context.globalCompositeOperation = compositeOperation;
        console.log(pageData);
        this.download(pageData.replace(mimeType, "image/octet-stream"),name + suffix);
    },
    /**
     * 发起下载
     * @param imgData 图片数据
     * @param name 文件名称
     */
    download:function(imgData, name) {
        var save_link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
        save_link.href = imgData;
        save_link.download = name;

        var event = document.createEvent('MouseEvents');
        event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        save_link.dispatchEvent(event);
    }
};