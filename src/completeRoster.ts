type Gender = '남' | '여';
type Role = 'war' | 'civil' | 'strategist' | 'royal' | 'support' | 'female' | 'tribal';

type OfficerData = {
  id: string;
  name: string;
  courtesyName: string;
  birthYear: number | null;
  deathYear: number | null;
  gender: Gender;
  force: string;
  city: string;
  activeFrom: number;
  activeTo: number;
  leadership: number;
  martial: number;
  intelligence: number;
  politics: number;
  charisma: number;
  traits: string[];
  relations: string[];
  portraitKey: string;
  fullBodyKey: string;
};

type Person = [id: string, name: string, courtesyName?: string];
type Group = {
  key: string;
  force: string;
  city: string;
  from: number;
  to: number;
  role: Role;
  tag: string;
  gender?: Gender;
  people: Person[];
};

const PRESET: Record<Role, [number, number, number, number, number]> = {
  war: [78, 83, 61, 52, 70],
  civil: [54, 30, 82, 87, 76],
  strategist: [66, 38, 89, 83, 79],
  royal: [66, 48, 73, 78, 81],
  support: [62, 55, 69, 67, 70],
  female: [38, 26, 74, 73, 86],
  tribal: [76, 84, 56, 45, 72],
};

const ROLE_LABEL: Record<Role, string> = {
  war: '장수',
  civil: '문관',
  strategist: '모사',
  royal: '황족·군주',
  support: '인물',
  female: '여성인물',
  tribal: '이민족',
};

const GROUPS: Group[] = [
  {
    key: 'han-court', force: '후한 조정', city: 'luoyang', from: 184, to: 220, role: 'civil', tag: '후한',
    people: [
      ['lingdi','영제'], ['shaodi','소제'], ['xiandi','헌제','백화'], ['zhangrang','장양'], ['zhaozhong','조충'],
      ['jianshuo','건석'], ['duangui','단규'], ['guosheng_eunuch','곽승'], ['xiayun','하운'], ['bilan','필람'],
      ['hemao','하묘'], ['wukuang','오광'], ['dongcheng','동승'], ['fuwan','복완'], ['gengji','경기','계행'],
      ['weihuang','위황'], ['jinyi','김의'], ['jiben','길본'], ['wangzifu','왕자복'], ['wushuo','오석'],
      ['yangbiao','양표','문선'], ['yangci','양사','백헌'], ['zhangwen_han','장온','백신'], ['zhanghuan_han','장환','연명'],
      ['chenfan','진번','중거'], ['douWu','두무','유평'], ['lihong_han','이홍'], ['zhoubi','주비'], ['wufu','오부'],
      ['shisunrui','사손서','군영'], ['huangwan','황완','자염'], ['zhaoqi','조기','빈경'], ['zhangjian_han','장검','원절'],
      ['fanpang','범방','맹박'], ['licha o','이조'], ['zhongji','종집'], ['zhongshao','종소'], ['chenyi_han','진일']
    ],
  },
  {
    key: 'warlords-north', force: '군웅', city: 'ye', from: 184, to: 210, role: 'war', tag: '군벌',
    people: [
      ['zhangchao','장초'], ['zanghong','장홍','자원'], ['kongzhou','공주','공서'], ['zhangyang','장양','치숙'],
      ['yangchou','양추'], ['suigu','수고'], ['yudu','우독'], ['bairao','백요'], ['zhangyan','장연','비연'],
      ['guanjing_gsz','관정','사기'], ['zoudan','추단'], ['shanjing','선경'], ['weiyou','위유'],
      ['xuyou','허유','자원'], ['xinping','신평','중치'], ['wangxiu_yuan','왕수','숙치'], ['hanheng','한형','자패'],
      ['zhangnan_yuan','장남'], ['jiaochu','초촉'], ['lvweihuang','여위황'], ['gaorui_yuan','고유'], ['hanjuzi','한거자'],
      ['wangmen','왕문'], ['zhangyi_yuan','장의'], ['yinKai','윤해'], ['suYou','소유'], ['mengDai','맹대'],
      ['pangji_yuan','방기'], ['chenlin','진림','공장'], ['guoyuan_yuan','곽원'], ['zhangsheng','장성'], ['liangqi','양기']
    ],
  },
  {
    key: 'jing-yi-liang', force: '지방군벌', city: 'xiangyang', from: 190, to: 220, role: 'civil', tag: '형주·익주·서량',
    people: [
      ['fuxun','부손','공제'], ['dengxi_jing','등희'], ['liuxian_jing','유선'], ['wangwei_jing','왕위'], ['huangshe','황사'],
      ['zhangwu_jing','장무'], ['pangxi','방희'], ['zhangsu_yizhou','장숙','군교'], ['wanglei_yizhou','왕루'], ['zhengdu','정도'],
      ['gaopei','고패'], ['yanghuai','양회'], ['feiguan','비관'], ['yanpu','염포'], ['yangsong','양송'], ['yangren','양임'],
      ['yangang','양앙'], ['zhangwei_hanzhong','장위'], ['chengyi','성의'], ['likan','이감'], ['zhangheng_liang','장횡'],
      ['liangxing','양흥'], ['houxuan','후선'], ['chengyin','정은'], ['mawan','마완'], ['yangqiu','양추'], ['duanwei','단외','충명'],
      ['hucheer','호거아'], ['liuxun_lujiang','유훈'], ['zhangkai','장개'], ['zhaoyu','조욱','원달'], ['zhangling','장릉'],
      ['zhangwei_yizhou','장위_익주'], ['renqi','임기'], ['wangshang','왕상'], ['zhangyu_yizhou','장유'], ['liuba_yizhou','유파_익주']
    ],
  },
  {
    key: 'wei-early', force: '조조군', city: 'xuchang', from: 190, to: 235, role: 'civil', tag: '위·조조',
    people: [
      ['cuiyan','최염','계규'], ['simalang','사마랑','백달'], ['duxi','두습','자서'], ['zhaoyan_wei','조엄','백연'],
      ['liushao','유소','공재'], ['weizhen','위진','공진'], ['liangxi','양습','자우'], ['zhenghun','정혼','문공'], ['luyu','노육','세옹'],
      ['sunli','손례','덕달'], ['tianyu','전예','국양'], ['xuxuan','서선','보견'], ['mengkang','맹강','공휴'], ['hanji','한기','공지'],
      ['renjun','임준','백달'], ['gaorou','고유','문혜'], ['wangsi','왕사'], ['wenhui','온회','만기'], ['xumiao','서막','경산'],
      ['huzhi','호질','문덕'], ['yangfu','양부','의산'], ['huzhao','호소','공명'], ['huanjie','환계','백서'], ['jiangxu','강서','백익'],
      ['liangkuan','양관'], ['zhaoqu','조구'], ['yinfeng','윤봉'], ['qianzhao','견초','자경'], ['yanrou','염유'],
      ['xianyufu','선우보'], ['xianyuyin','선우은'], ['tianchou','전주','자태'], ['hanlong','한룡'], ['wangcan_wei','왕찬_위'],
      ['zhangfan','장범'], ['zhangcheng_wei','장승_위'], ['heku i','하기'], ['liangmao','양무'], ['guoyuan_wei','국연'],
      ['xuanyi','현의'], ['chenqian_wei','진건'], ['zhaozi','조자'], ['zhangji_wei_civil','장기','덕용'], ['xuehong','설홍']
    ],
  },
  {
    key: 'wei-royal', force: '위', city: 'luoyang', from: 200, to: 280, role: 'royal', tag: '위황실',
    people: [
      ['caoyu','조우','팽조'], ['caolin','조림'], ['caogun','조곤','자문'], ['caoju','조거'], ['caobiao','조표','주호'],
      ['caoxiong','조웅'], ['caoxi','조희'], ['caoxun','조훈'], ['xiahouxian','하후헌'], ['xiahouhui','하후혜','치권'],
      ['xiahourong','하후영'], ['caokai','조해'], ['caohui','조휘'], ['caomao_prince','조무'], ['caodong','조동'],
      ['caojun','조준'], ['caogan','조간'], ['caoshang','조상_왕'], ['caobing','조병'], ['caowei_prince','조위']
    ],
  },
  {
    key: 'wei-late', force: '위', city: 'luoyang', from: 220, to: 280, role: 'war', tag: '위말',
    people: [
      ['simawang','사마망','자초'], ['simazhou','사마주','자장'], ['zhugedan','제갈탄','공휴'], ['guanqiujian','관구검','중공'],
      ['wenqin','문흠','중약'], ['wenyang','문앙','차건'], ['wenhu','문호'], ['wangjing','왕경','언위'], ['wangchen_wei','왕침','처도'],
      ['jiaochong','가충','공려'], ['shibao','석포','중용'], ['zhanghu','장호'], ['yuechen','악침'], ['dingmi','정밀','언정'],
      ['lisheng','이승','공소'], ['bikui','필궤','소선'], ['chengwu','성무'], ['wangchang_wei','왕창','문서'], ['wangguan_wei','왕관','위태'],
      ['wenzhong','문종'], ['guohuai_son','곽통'], ['chenben','진본'], ['wangsu','왕숙','자옹'], ['liufang','유방','자기'],
      ['sunzi_wei','손자','언룡'], ['qinhui_wei','진회'], ['wangmao_wei','왕모'], ['zhangte','장특'], ['yinyun','윤윤'],
      ['liuzhou_wei','유주'], ['hushi','호세'], ['wangguang_wei','왕광'], ['zhangqiu_jian','장구검'], ['zhengchong','정충']
    ],
  },
  {
    key: 'shu', force: '촉', city: 'chengdu', from: 214, to: 270, role: 'civil', tag: '촉한',
    people: [
      ['liuyong','유영','공수'], ['liuli_shu','유리','봉효'], ['liuchen','유심'], ['guansuo','관색'], ['zhangyi_bogong','장익','백공'],
      ['futong','부동'], ['fuqian','부첨'], ['luoxian','나헌','영칙'], ['zongyu','종예','덕염'], ['liaoli','요립','공연'],
      ['limiao_shu','이막','한남'], ['lifu_shu','이복','손덕'], ['yangyi','양의','위공'], ['dongjue','동궐','공습'], ['fanjian','번건','장원'],
      ['xiangchong','상총'], ['xianglang','상랑','거달'], ['chenshi','진식'], ['wuban','오반','원웅'], ['gaoxiang','고상'],
      ['liuyin','유은','휴연'], ['jufu','구부'], ['zhangbiao_shu','장표','백달'], ['huji_shu','호제','위도'], ['duqiong','두경','백유'],
      ['zhouqun','주군','중직'], ['zhangyu_astrologer','장유'], ['jiangbin','강빈'], ['jiangxian','강현'], ['huangchong','황숭'],
      ['huanghao','황호'], ['chenzhi_shu','진지','봉종'], ['yanyu_shu','염우','문평'], ['zhangshao_shu','장소'], ['guanyi','관이'],
      ['liuxuan_shu','유선_태자'], ['zhangnan_shu','장남'], ['fengxi','풍습','휴원'], ['xizheng','극정','영선'], ['wanghan_shu','왕함'],
      ['liyan_son','이풍_촉'], ['zhangyi_yidu','장이'], ['yangwan','양완'], ['zhangmu_shu','장목'], ['lidangzhi','이당지']
    ],
  },
  {
    key: 'wu', force: '오', city: 'jianye', from: 208, to: 280, role: 'civil', tag: '동오',
    people: [
      ['sunhe','손화','자효'], ['sunba','손패','자위'], ['sunliang','손량','자명'], ['sunxiu','손휴','자열'], ['sunhao','손호','원종'],
      ['sunchen_regent','손침','자통'], ['sunjun_regent','손준','자원'], ['tengyin','등윤','승사'], ['lvju','여거','세의'], ['zhuyi_wu','주이','계문'],
      ['zhuji_wu','주적','공위'], ['dingfeng_junior','정봉_소'], ['lukai','육개','경풍'], ['luyin','육윤','경종'], ['lumao','육모','자장'],
      ['quanyi','전의'], ['quanxu','전서'], ['quanji','전기'], ['tangzi','당자'], ['heshao_wu','하소','소공'],
      ['zhangti','장제','거선'], ['shenying','심영'], ['wuyan_wu','오언'], ['wucan','오찬','공휴'], ['gutan','고담','자묵'],
      ['gucheng','고승','자직'], ['yusi','우사','세홍'], ['huzong','호종','위칙'], ['xuexu','설후'], ['xueying','설영','도언'],
      ['weizhao','위소','홍사'], ['huahe','화핵','영선'], ['puyangxing','복양흥','자원'], ['wanyu','만욱'], ['louxuan','누현','승선'],
      ['zhangbu_wu','장포_오'], ['zhoufang','주방','자어'], ['taohuang','도황','세영'], ['sunhong','손홍'], ['sunfen','손분','자양'],
      ['lujing','육경','사인'], ['buxie','보협'], ['buchan','보천','중사'], ['quanshang','전상'], ['sunji','손기'],
      ['luji_late','육기'], ['lu yun','육운'], ['zhangyan_wu','장엄'], ['sunxiu_official','손수'], ['guochong_wu','곽충']
    ],
  },
  {
    key: 'romance', force: '기타', city: 'luoyang', from: 184, to: 230, role: 'war', tag: '연의·단역',
    people: [
      ['panfeng','반봉'], ['fangyue','방열'], ['wuanguo','무안국'], ['yushe','유섭'], ['xiahoujie','하후걸'],
      ['kongxiu_gate','공수'], ['hanfu_gate','한복_관장'], ['bianxi','변희'], ['wangzhi_gate','왕식'], ['qinqi','진기'],
      ['mengtan','맹탄'], ['chezhou','차주'], ['caiyang','채양'], ['duyuan','두원'], ['guanding','관정'],
      ['guanhai','관해'], ['zhangrao','장요'], ['xuhe_yellow','서화'], ['simaju_yellow','사마구'], ['mayuanyi','마원의'],
      ['tangzhou','당주'], ['pengtuo','팽탈'], ['changxi','창희'], ['sunguan','손관'], ['yinli','윤례'], ['wudun','오돈'],
      ['wangzhong_wei','왕충'], ['hanxuan','한현'], ['liudu','유도'], ['zhaofan','조범'], ['jinxuan','김선'],
      ['yangling','양령'], ['xingdaorong','형도영'], ['chenying_jing','진응'], ['baolong','포융'], ['gongzhi','공지'],
      ['fushiren','부사인'], ['fanjiang','범강'], ['zhangda','장달'], ['mazhong_wu','마충_오'], ['lvmenguan','여몽관'],
      ['zhangFei_soldier','범강부장'], ['hanDe','한덕'], ['hande_son1','한영'], ['hande_son2','한요'], ['hande_son3','한경'],
      ['hande_son4','한기'], ['yaomiao','요묘'], ['jiafan','가범'], ['songqian','송겸'], ['xielan','사란']
    ],
  },
  {
    key: 'frontier', force: '이민족', city: 'beiping', from: 184, to: 260, role: 'tribal', tag: '북방·서방 이민족',
    people: [
      ['tadun','답돈'], ['qiuliju','구력거'], ['louban','누반'], ['supuyan','소복연'], ['wuyan_wuhuan','오연'], ['nanlou','난루'],
      ['kebineng','가비능'], ['budugen','보도근'], ['suli_xianbei','소리'], ['mijia','미가'], ['queji','궐기'], ['kuitou','괴두'],
      ['beigongboyu','북궁백옥'], ['liwenhou','이문후'], ['songjian','송건'], ['qiangduan','강단'], ['kewu','가오'],
      ['huchuquan','호주천'], ['yufuluo','어부라'], ['qubei','거비'], ['liubao_xiongnu','유표_흉노'], ['feizhan','비잔'],
      ['penghu_shanyue','팽호'], ['zhangchun_wuhuan','장순'], ['zhangju_wuhuan','장거'], ['wuhuanwang','오환왕'],
      ['eluoduo','아라다'], ['nahelu','나하루'], ['zhimi','치미'], ['a luoduo','아라다왕'], ['qiongdu','공도_강족']
    ],
  },
  {
    key: 'women', force: '각 세력', city: 'xuchang', from: 184, to: 270, role: 'female', tag: '여성·가족', gender: '여',
    people: [
      ['ladyliu_yuan','유부인'], ['ladyfeng_yuanshu','풍씨'], ['ladyzou','추씨'], ['ladyyan_lvbu','엄씨'], ['ladycai_jing','채부인'],
      ['ladydu','두씨'], ['ladyhuan_cao','환부인'], ['empressmao_wei','모황후'], ['empressguo_ming','곽황후'], ['ladyxu_sunyi','서씨'],
      ['ladyxie_sunquan','사희'], ['ladywang_sunxiu','왕부인'], ['empresszhu_wu','주황후'], ['empresszhang_elder','경애황후'],
      ['empresszhang_younger','장황후'], ['ladyxiahou_shu','하후씨'], ['empresswu_shu','목황후'], ['zhangxingcai','장성채'],
      ['ladybian_later','변황후'], ['ladyguo_cao','곽씨'], ['ladycao_liu','조씨_유비가'], ['ladyma','마씨'], ['ladyzhao','조씨'],
      ['ladychen','진씨'], ['ladyhe_wu','하씨'], ['ladyquan','전씨'], ['ladyzhang_wu','장씨'], ['ladylu','육씨']
    ],
  },
  {
    key: 'jin', force: '서진', city: 'luoyang', from: 234, to: 300, role: 'war', tag: '삼국말·서진',
    people: [
      ['simayan','사마염','안세'], ['simayou','사마유','대유'], ['yanghu','양호','숙자'], ['duyu','두예','원개'],
      ['wangjun_jin','왕준','사치'], ['wanghun','왕혼','현충'], ['zhouzhi_jin','주지','사정'], ['hufen','호분','현위'],
      ['malong','마륭','효흥'], ['wangrong','왕융','준충'], ['weiguan','위관','백옥'], ['chenqian','진건','휴연'], ['zhanghua','장화','무선'],
      ['hu lie_jin','호열'], ['hu fen_jin','호분_진'], ['simaLiang','사마량'], ['simajun','사마준'], ['simalun','사마륜'],
      ['wangji_jin','왕제'], ['shijian','석감'], ['tangbin','당빈'], ['maLong_sub','마륭부장'], ['wenyang_jin','문앙_진'],
      ['zhoujun_jin','주준_진'], ['yangji','양제'], ['zhangqiao_jin','장교'], ['wangkai_jin','왕개'], ['hepan','하반']
    ],
  },
];

export const COMPLETE_OFFICERS_DATA: OfficerData[] = GROUPS.flatMap(group =>
  group.people.map(([id, name, courtesyName = ''], index) => {
    const stats = PRESET[group.role];
    const stableId = `complete-${group.key}-${id || index}`;
    return {
      id: stableId,
      name,
      courtesyName,
      birthYear: null,
      deathYear: null,
      gender: group.gender ?? '남',
      force: group.force,
      city: group.city,
      activeFrom: group.from,
      activeTo: group.to,
      leadership: stats[0],
      martial: stats[1],
      intelligence: stats[2],
      politics: stats[3],
      charisma: stats[4],
      traits: [group.tag, ROLE_LABEL[group.role]],
      relations: [],
      portraitKey: stableId,
      fullBodyKey: `${stableId}-full`,
    };
  })
);
