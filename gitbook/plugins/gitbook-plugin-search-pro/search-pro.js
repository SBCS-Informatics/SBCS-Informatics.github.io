require(['gitbook',"core/state","core/events","lodash","utils/storage","core/sidebar","core/navigation","core/loading"], function (gitbook,state,events,_,storage,sidebar,navigation,loading) {
    
    var 
        pluginConfig,
        indexData
        ;

    // 高亮文本
    var highLightPageInner = function(keyword) { 
        var reg = new RegExp('(' + keyword.replace(/,/,'|') + ')','ig');
        $('.page-inner').html($('.page-inner').html().replace(reg,'<span class="search-highlight">$1</span>'));
        
        // 定位到第一个高亮词
        var firstWordTop = $('.search-highlight')[0].offsetTop;
        $('.body-inner').scrollTop(firstWordTop);
        
    }

    // 取消高亮
    var removeHighLight = function() { 
        var reg = new RegExp('<span class="search-highlight">(.*?)</span>','ig');

        $('.page-inner').html($('.page-inner').html().replace(reg,'$1'));
        
        // 回到顶端
        // $('.body-inner').scrollTop(0);
    }
    
    // 判断 searchbar 有没有开启
    var isSearchOpen = function() {
        return state.$book.hasClass("with-search");
    };
    
    // 根据word获取匹配到的Paths
    var getMatchWordPaths = function(keyword){
        
        // 匹配到的路径
        var matchPaths = [];
        
        // 匹配到的Page序列
        var matchPageIndexs = indexData.searchIndexMap[keyword];

        // 生成供筛选参数（路径列表）
        _(matchPageIndexs).forEach(function(matchIndex) {
            matchPaths.push(indexData.pageIndex[matchIndex].path);
        }).value();
        
        return matchPaths;
    }
    
    // 切换 search bar
    var toggleSearch = function(_state) {
        if (state != null && isSearchOpen() == _state) return;

        var $searchInput = $(".book-search input");
        state.$book.toggleClass("with-search", _state);

        // If search bar is open: focus input
        if (isSearchOpen()) {
            sidebar.toggle(true);
            $searchInput.focus();
        } else {
            $searchInput.blur();
            $searchInput.val("");
            sidebar.filter(null);
            removeHighLight();
            storage.remove("keyword");
        }
    };
    
    // 还原搜索框状态
    var recoverSearch = function() {
        var keyword = storage.get("keyword", "");
        if(keyword.length > 0) {
            
            // 是否收起search
            if(!isSearchOpen()){
                toggleSearch();
            }
            
            // 过滤文本
            sidebar.filter(getMatchWordPaths(keyword));
            
            // 页面文本高亮关键词
            highLightPageInner(keyword);
            
            
        }
        $(".book-search input").val(keyword);
    };
    
    // 初始化函数
    var init = function () {
        
        // 清除原始的搜索相关事件
        $(document).off("click", ".book-header .toggle-search");
        $(document).off("keyup", ".book-search input");
        
        // 绑定新的搜索函数
        $(document).on("click", ".book-header .toggle-search",function(e){
            
            e.preventDefault();
            toggleSearch();
            
        });

        // 在SearchBar中输入
        $(document).on("keyup", ".book-search input", function(e) {

            var keyword = $(this).val().toUpperCase();
            
            if (keyword.length == 0) {
                sidebar.filter(null);
                storage.remove("keyword");
            } else {
                
                // 开始筛选
                sidebar.filter(getMatchWordPaths(keyword));
                
                // 记忆关键词
                storage.set("keyword", keyword);
            }
            
        });
        
        $(document).on("keyup", function(e) {
            var key = (e.keyCode ? e.keyCode : e.which);
            if (key == 27) {
                e.preventDefault();
                toggleSearch(false);
                return;
            }
        })
        
        // 启动载入索引
        $.getJSON(state.basePath + "/search_pro_index.json").then(function(data){
            indexData = data;
            events.trigger("page.loadedSearchProIndex");
        });
        
    };


    // ----- 声明周期事件 ------
    
    // 页面初次进入执行
    events.bind('start', function (e, config) {
        // 获取 config
        pluginConfig = config['search-pro'];
        // 初始化
        init();
    });

    // 页面切换执行
    events.bind('page.loadedSearchProIndex', function () {
        // 载入索引后绑定页面change事件
        events.bind('page.change', function () {
            recoverSearch();
        });
    });

});