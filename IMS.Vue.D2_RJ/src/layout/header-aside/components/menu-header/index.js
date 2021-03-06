import {
  throttle
} from 'lodash'
import {
  mapState,
  mapActions
} from 'vuex'
import menuMixin from '../mixin/menu'
import {
  elMenuItem,
  elSubmenu
} from '../libs/util.menu'

export default {
  name: 'd2-layout-header-aside-menu-header',
  mixins: [
    menuMixin
  ],
  render (createElement) {
    return createElement('div', {
      attrs: {
        flex: 'cross:center'
      },
      class: {
        'd2-theme-header-menu': true, 'is-scrollable': this.isScroll
      },
      ref: 'page'
    }, [
      createElement('div', {
        attrs: {
          class: 'd2-theme-header-menu__content',
          flex: '',
          'flex-box': '1'
        },
        ref: 'content'
      }, [
        createElement('div', {
          attrs: {
            class: 'd2-theme-header-menu__scroll',
            'flex-box': '0'
          },
          style: {
            transform: `translateX(${this.currentTranslateX}px)`
          },
          ref: 'scroll'
        }, [
          createElement('el-menu', {
            props: {
              mode: 'horizontal',
              defaultActive: this.active,
              router: false
            },
            on: {
              select: (index, indexPath) => this.handleMenuSelect(index, indexPath, this.frameOut)
            },
            class: ['custom-menu'],
            ref: 'customMenu'
          }, this.header.map(menu => (menu.children === undefined ? elMenuItem : elSubmenu).call(this, createElement, menu, true)))
        ])
      ]),
      ...this.isScroll ? [
        createElement('div', {
          attrs: {
            class: 'd2-theme-header-menu__prev',
            flex: 'main:center cross:center',
            'flex-box': '0'
          },
          on: {
            click: () => this.scroll('left')
          }
        }, [
          createElement('i', {
            attrs: {
              class: 'el-icon-arrow-left'
            }
          })
        ]),
        createElement('div', {
          attrs: {
            class: 'd2-theme-header-menu__next',
            flex: 'main:center cross:center',
            'flex-box': '0'
          },
          on: {
            click: () => this.scroll('right')
          }
        }, [
          createElement('i', {
            attrs: {
              class: 'el-icon-arrow-right'
            }
          })
        ])
      ] : []
    ])
  },
  computed: {
    ...mapState('d2admin/menu', [
      'header'
    ]),
    ...mapState({
      collectionList: state => state.custom.collection.collectionList,
      collectionRoutes: state => state.custom.collection.collectionRoutes,
      frameOut: state => {
        return (state.custom.permission.frameOut || []).map(item => item.path)
      }
    })
  },
  data () {
    return {
      active: '',
      isScroll: false,
      scrollWidth: 0,
      contentWidth: 0,
      currentTranslateX: 0,
      throttledCheckScroll: null
    }
  },
  watch: {
    '$route.matched': {
      handler (val) {
        this.active = val[val.length - 1].path
      },
      immediate: true
    },
    '$i18n.locale': { // ???????????????????????????????????????scroll
      handler () {
        this.$parent.$nextTick(() => {
          this.checkScroll()
        })
      }
    }
  },
  methods: {
    ...mapActions({
      modifyCollection: 'custom/collection/modifyCollection'
    }),
    async handleCollection (menu) {
      await this.modifyCollection(menu)
      if (this.$route.matched && this.$route.matched[1]?.path === '/index') {
        this.$store.commit('d2admin/menu/asideSet', this.collectionRoutes)
      }
    },
    scroll (direction) {
      if (direction === 'left') {
        // ????????????
        this.currentTranslateX = 0
      } else {
        // ????????????
        if (this.contentWidth * 2 - this.currentTranslateX <= this.scrollWidth) {
          this.currentTranslateX -= this.contentWidth
        } else {
          this.currentTranslateX = this.contentWidth - this.scrollWidth
        }
      }
    },
    checkScroll () {
      let contentWidth = this.$refs.content.clientWidth
      let scrollWidth = this.$refs.scroll.clientWidth
      if (this.isScroll) {
        // ????????????????????????????????????????????????width
        if (this.contentWidth - this.scrollWidth === this.currentTranslateX) {
          // currentTranslateX ??????????????????????????????????????????????????????
          this.currentTranslateX = contentWidth - scrollWidth
          // ??????????????????????????????????????????????????????contentWidth???????????????????????????????????????
          if (this.currentTranslateX > 0) {
            this.currentTranslateX = 0
          }
        }
        // ??????????????????
        this.contentWidth = contentWidth
        this.scrollWidth = scrollWidth
        // ????????????????????????: ???scroll > content
        if (contentWidth > scrollWidth) {
          this.isScroll = false
        }
      }
      // ????????????????????????: ???scroll < content
      if (!this.isScroll && contentWidth < scrollWidth) {
        this.isScroll = true
        // ????????????isScroll??????true?????????????????????????????????????????????
        this.$nextTick(() => {
          contentWidth = this.$refs.content.clientWidth
          scrollWidth = this.$refs.scroll.clientWidth
          this.contentWidth = contentWidth
          this.scrollWidth = scrollWidth
          this.currentTranslateX = 0
        })
      }
    }
  },
  mounted () {
    // ???????????????
    this.$parent.$nextTick(() => {
      this.checkScroll()
    })
    // ????????????????????????????????????????????????????????????????????????????????????
    window.addEventListener('load', this.checkScroll)
    // ??????????????????????????????????????????????????????????????????????????????isScroll?????????
    this.throttledCheckScroll = throttle(this.checkScroll, 300)
    window.addEventListener('resize', this.throttledCheckScroll)
  },
  beforeDestroy () {
    // ????????????
    window.removeEventListener('resize', this.throttledCheckScroll)
    window.removeEventListener('load', this.checkScroll)
  }
}
