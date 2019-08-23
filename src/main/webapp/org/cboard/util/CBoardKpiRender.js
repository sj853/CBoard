var CBoardKpiRender = function (jqContainer, options) {
    this.container = jqContainer; // jquery object
    this.options = options;
};

CBoardKpiRender.prototype.html = function (persist) {
    var self = this;
    var temp = "" + self.template;
    var html = temp.render(self.options);
    if (persist) {
        setTimeout(function () {
            self.container.css('background', '#fff');
            html2canvas(self.container, {
                onrendered: function (canvas) {
                    persist.data = canvas.toDataURL("image/jpeg");
                    persist.type = "jpg";
                    persist.widgetType = "kpi";
                }
            });
        }, 1000);
        // persist.data = {name: self.options.kpiName, value: self.options.kpiValue};
        // persist.type = "kpi";
    }
    return html;
};

/**
 * 2019.08.21 liaoxx
 * kpi 下载图片工具配置
 */
CBoardKpiRender.prototype.buildImageExport = function() {
    var kpiDom = $(this.container[0].lastChild);
    var random = exportImageHelper.random();
    var toolBar = exportImageHelper.toolBar(random);
    kpiDom.before(toolBar);
    exportImageHelper.buildButton(random, kpiDom, 'kpi');
};

CBoardKpiRender.prototype.realTimeTicket = function () {
    var self = this;
    return function (o) {
        $(self.container).find('h3').html(o.kpiValue);
    }
};

CBoardKpiRender.prototype.do = function () {
    var self = this;
    $(self.container).html(self.rendered());
};

CBoardKpiRender.prototype.template =
    "<div class='small-box {style}'> \
               <div class='inner'> \
                  <h3>{kpiValue}</h3> \
                  <p>{kpiName}</p> \
               </div> \
               <div class='icon'> \
                   <i class='ion ion-stats-bars'></i> \
               </div> \
               <a class='small-box-footer'>\
                   <span ng-click='skip(widget)' ng-if='widget.extenal' style='cursor: pointer'>{skip} <i class='fa fa-share'></i></span>\
                   <span name='reload_{{widget.widget.id}}' ng-click='reload(widget)' style='cursor: pointer'>{refresh} <i class='fa fa-refresh'></i></span>\
                   <span ng-click='config(widget)' ng-if='widgetCfg' style='cursor: pointer'>{edit} <i class='fa fa-wrench'></i></span>\
               </a>\
            </div>";
