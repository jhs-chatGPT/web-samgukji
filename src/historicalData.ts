import { EXTRA_OFFICERS_DATA } from './expandedRoster';
import { COMPLETE_OFFICERS_DATA } from './completeRoster';
import { REFERENCE_OFFICERS_DATA, REFERENCE_SCENARIO_COUNTS, resolveReferenceProfile } from './referenceRoster';
import { enrichOfficer, type OfficerAdvancedFields } from './officerSystem';

type CitySeed = {
  id: string;
  name: string;
  region: string;
  tier: number;
  neighbors: string[];
  availableFrom?: number;
};

type LegacyOfficerData = {
  id: string;
  name: string;
  courtesyName: string;
  birthYear: number | null;
  birthYearEstimated?: boolean;
  deathYear: number | null;
  gender: '남' | '여';
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

export type OfficerData = LegacyOfficerData & OfficerAdvancedFields;

export const SCENARIOS_DATA = [
  { id: 'yellow-turban', year: 184, title: '황건의 난', subtitle: '한실의 균열', description: '황건 봉기로 후한의 질서가 흔들리고 각지의 영웅이 등장한다.' },
  { id: 'anti-dongzhuo', year: 190, title: '반동탁 연합', subtitle: '군웅의 집결', description: '동탁의 전횡에 맞서 관동 제후가 연합한 시대.' },
  { id: 'warlords', year: 194, title: '군웅할거', subtitle: '천하의 분열', description: '조조·원소·유비·원술·여포·손씨 세력이 각지에서 충돌한다.' },
  { id: 'guandu', year: 200, title: '관도대전', subtitle: '조조와 원소', description: '중원의 패권을 두고 조조와 원소가 정면으로 맞선다.' },
  { id: 'red-cliffs', year: 208, title: '적벽대전', subtitle: '천하삼분의 전조', description: '형주를 장악한 조조와 손권·유비 연합이 장강에서 충돌한다.' },
  { id: 'yizhou', year: 214, title: '유비의 익주 입성', subtitle: '서촉의 주인', description: '유비가 성도를 차지하고 조조·손권과 삼강 구도를 만든다.' },
  { id: 'hanzhong', year: 219, title: '한중왕 유비', subtitle: '삼국 정립 직전', description: '유비가 한중을 얻고 관우가 형주 북부를 압박한다.' },
  { id: 'yiling', year: 221, title: '이릉대전', subtitle: '촉한 건국과 동오', description: '유비가 황제에 오른 뒤 형주 문제를 둘러싸고 촉한과 동오가 격돌하는 시대.' },
  { id: 'northern-expedition', year: 227, title: '출사표', subtitle: '제갈량의 북벌', description: '위·촉·오 삼국이 정립되고 제갈량의 북벌이 시작된다.' },
  { id: 'wuzhang', year: 234, title: '오장원', subtitle: '별이 지는 들판', description: '제갈량과 사마의가 관중에서 마지막 대치를 벌인다.' },
];

const ALL_CITIES: CitySeed[] = [
  { id: 'luoyang', name: '낙양', region: '사예', tier: 5, neighbors: ['chang_an', 'hongnong', 'henei', 'wan', 'xuchang'] },
  { id: 'chang_an', name: '장안', region: '사예', tier: 5, neighbors: ['luoyang', 'hongnong', 'hedong', 'anding', 'tianshui', 'hanzhong'] },
  { id: 'hongnong', name: '홍농', region: '사예', tier: 3, neighbors: ['luoyang', 'chang_an', 'wan'] },
  { id: 'henei', name: '하내', region: '사예', tier: 3, neighbors: ['luoyang', 'ye', 'chenliu', 'jinyang'] },
  { id: 'hedong', name: '하동', region: '사예', tier: 3, neighbors: ['chang_an', 'hongnong', 'shangdang'] },
  { id: 'ye', name: '업', region: '기주', tier: 5, neighbors: ['nanpi', 'julu', 'changshan', 'henei', 'puyang', 'xuchang'] },
  { id: 'nanpi', name: '남피', region: '기주', tier: 4, neighbors: ['ye', 'bohai', 'beiping', 'pingyuan'] },
  { id: 'bohai', name: '발해', region: '기주', tier: 3, neighbors: ['nanpi', 'pingyuan', 'julu'] },
  { id: 'julu', name: '거록', region: '기주', tier: 3, neighbors: ['ye', 'bohai', 'changshan', 'pingyuan'] },
  { id: 'changshan', name: '상산', region: '기주', tier: 3, neighbors: ['julu', 'ye', 'zhongshan', 'jinyang'] },
  { id: 'zhongshan', name: '중산', region: '기주', tier: 3, neighbors: ['changshan', 'zhuo', 'beiping'] },
  { id: 'pingyuan', name: '평원', region: '청주', tier: 3, neighbors: ['nanpi', 'bohai', 'julu', 'beihai', 'jinan'] },
  { id: 'beihai', name: '북해', region: '청주', tier: 4, neighbors: ['pingyuan', 'jinan', 'donglai', 'langya'] },
  { id: 'jinan', name: '제남', region: '청주', tier: 3, neighbors: ['pingyuan', 'beihai', 'taishan', 'puyang'] },
  { id: 'donglai', name: '동래', region: '청주', tier: 3, neighbors: ['beihai', 'langya'] },
  { id: 'ji', name: '계', region: '유주', tier: 4, neighbors: ['zhuo', 'beiping', 'dai'] },
  { id: 'zhuo', name: '탁', region: '유주', tier: 3, neighbors: ['ji', 'zhongshan', 'pingyuan'] },
  { id: 'beiping', name: '북평', region: '유주', tier: 4, neighbors: ['ji', 'zhuo', 'zhongshan', 'xiangping'] },
  { id: 'dai', name: '대', region: '유주', tier: 2, neighbors: ['ji', 'jinyang'] },
  { id: 'xiangping', name: '양평', region: '요동', tier: 4, neighbors: ['beiping', 'xuantu', 'lelang'] },
  { id: 'xuantu', name: '현도', region: '요동', tier: 3, neighbors: ['xiangping', 'gungnae', 'buyeo'] },
  { id: 'lelang', name: '낙랑', region: '한반도 북부', tier: 4, neighbors: ['xiangping', 'daifang', 'dongye', 'mahan'] },
  { id: 'daifang', name: '대방', region: '한반도 서북부', tier: 3, neighbors: ['lelang', 'mahan'], availableFrom: 204 },
  { id: 'gungnae', name: '국내성', region: '고구려', tier: 4, neighbors: ['xuantu', 'buyeo', 'okjeo', 'dongye'] },
  { id: 'buyeo', name: '부여성', region: '부여', tier: 4, neighbors: ['xuantu', 'gungnae'] },
  { id: 'okjeo', name: '옥저', region: '한반도 동북부', tier: 2, neighbors: ['gungnae', 'dongye'] },
  { id: 'dongye', name: '동예', region: '한반도 동부', tier: 2, neighbors: ['gungnae', 'okjeo', 'lelang', 'jinhan'] },
  { id: 'mahan', name: '위례성', region: '백제', tier: 3, neighbors: ['lelang', 'daifang', 'jinhan', 'byeonhan'] },
  { id: 'jinhan', name: '금성', region: '신라', tier: 3, neighbors: ['dongye', 'mahan', 'byeonhan'] },
  { id: 'byeonhan', name: '가야', region: '가야', tier: 3, neighbors: ['mahan', 'jinhan'] },
  { id: 'jinyang', name: '진양', region: '병주', tier: 4, neighbors: ['dai', 'changshan', 'henei', 'shangdang'] },
  { id: 'shangdang', name: '상당', region: '병주', tier: 3, neighbors: ['jinyang', 'henei', 'hedong', 'luoyang'] },
  { id: 'chenliu', name: '진류', region: '연주', tier: 4, neighbors: ['henei', 'puyang', 'xuchang', 'qiao'] },
  { id: 'puyang', name: '복양', region: '연주', tier: 4, neighbors: ['ye', 'jinan', 'chenliu', 'taishan', 'xuchang'] },
  { id: 'taishan', name: '태산', region: '연주', tier: 3, neighbors: ['jinan', 'puyang', 'langya', 'xiaopei'] },
  { id: 'xuchang', name: '허창', region: '예주', tier: 5, neighbors: ['luoyang', 'ye', 'chenliu', 'qiao', 'runan', 'wan'] },
  { id: 'qiao', name: '초', region: '예주', tier: 3, neighbors: ['chenliu', 'xuchang', 'runan', 'shouchun'] },
  { id: 'runan', name: '여남', region: '예주', tier: 4, neighbors: ['xuchang', 'qiao', 'shouchun', 'xinye'] },
  { id: 'chen', name: '진', region: '예주', tier: 3, neighbors: ['qiao', 'runan', 'xiaopei'] },
  { id: 'xiapi', name: '하비', region: '서주', tier: 5, neighbors: ['xiaopei', 'langya', 'guangling', 'shouchun'] },
  { id: 'xiaopei', name: '소패', region: '서주', tier: 3, neighbors: ['xiapi', 'taishan', 'chen', 'qiao'] },
  { id: 'langya', name: '낭야', region: '서주', tier: 3, neighbors: ['beihai', 'donglai', 'taishan', 'xiapi'] },
  { id: 'guangling', name: '광릉', region: '서주', tier: 3, neighbors: ['xiapi', 'shouchun', 'jianye'] },
  { id: 'shouchun', name: '수춘', region: '양주', tier: 5, neighbors: ['qiao', 'runan', 'xiapi', 'guangling', 'lujiang', 'hefei'] },
  { id: 'hefei', name: '합비', region: '양주', tier: 4, neighbors: ['shouchun', 'lujiang', 'jianye'] },
  { id: 'lujiang', name: '여강', region: '양주', tier: 4, neighbors: ['shouchun', 'hefei', 'jianye', 'chaisang'] },
  { id: 'jianye', name: '건업', region: '양주', tier: 5, neighbors: ['guangling', 'hefei', 'lujiang', 'wu', 'chaisang'] },
  { id: 'wu', name: '오', region: '양주', tier: 4, neighbors: ['jianye', 'kuaiji'] },
  { id: 'kuaiji', name: '회계', region: '양주', tier: 4, neighbors: ['wu', 'poyang'] },
  { id: 'chaisang', name: '시상', region: '양주', tier: 4, neighbors: ['jianye', 'lujiang', 'poyang', 'jiangxia'] },
  { id: 'poyang', name: '파양', region: '양주', tier: 3, neighbors: ['kuaiji', 'chaisang', 'changsha'] },
  { id: 'wan', name: '완', region: '형주', tier: 4, neighbors: ['luoyang', 'xuchang', 'xinye', 'xiangyang'] },
  { id: 'xinye', name: '신야', region: '형주', tier: 3, neighbors: ['runan', 'wan', 'xiangyang', 'jiangxia'] },
  { id: 'xiangyang', name: '양양', region: '형주', tier: 5, neighbors: ['wan', 'xinye', 'jiangling', 'jiangxia', 'shangyong'] },
  { id: 'jiangling', name: '강릉', region: '형주', tier: 5, neighbors: ['xiangyang', 'jiangxia', 'wuling', 'yongan'] },
  { id: 'jiangxia', name: '강하', region: '형주', tier: 4, neighbors: ['xinye', 'xiangyang', 'jiangling', 'chaisang', 'changsha'] },
  { id: 'changsha', name: '장사', region: '형주', tier: 4, neighbors: ['jiangxia', 'poyang', 'wuling', 'guiyang'] },
  { id: 'wuling', name: '무릉', region: '형주', tier: 3, neighbors: ['jiangling', 'changsha', 'lingling'] },
  { id: 'lingling', name: '영릉', region: '형주', tier: 3, neighbors: ['wuling', 'guiyang', 'jiaozhi'] },
  { id: 'guiyang', name: '계양', region: '형주', tier: 3, neighbors: ['changsha', 'lingling', 'nanhai'] },
  { id: 'hanzhong', name: '한중', region: '익주', tier: 5, neighbors: ['chang_an', 'tianshui', 'wudu', 'shangyong', 'zitong'] },
  { id: 'shangyong', name: '상용', region: '형주', tier: 3, neighbors: ['xiangyang', 'hanzhong', 'yongan'] },
  { id: 'wudu', name: '무도', region: '량주', tier: 3, neighbors: ['tianshui', 'hanzhong', 'zitong'] },
  { id: 'chengdu', name: '성도', region: '익주', tier: 5, neighbors: ['zitong', 'jiangzhou', 'jianning'] },
  { id: 'zitong', name: '자동', region: '익주', tier: 4, neighbors: ['hanzhong', 'wudu', 'chengdu', 'jiangzhou'] },
  { id: 'jiangzhou', name: '강주', region: '익주', tier: 4, neighbors: ['chengdu', 'zitong', 'yongan', 'fuling'] },
  { id: 'yongan', name: '영안', region: '익주', tier: 4, neighbors: ['jiangling', 'shangyong', 'jiangzhou'] },
  { id: 'fuling', name: '부릉', region: '익주', tier: 3, neighbors: ['jiangzhou', 'jianning'] },
  { id: 'jianning', name: '건녕', region: '익주 남중', tier: 3, neighbors: ['chengdu', 'fuling', 'yunnan', 'yongchang'] },
  { id: 'yunnan', name: '운남', region: '익주 남중', tier: 3, neighbors: ['jianning', 'yongchang'] },
  { id: 'yongchang', name: '영창', region: '익주 남중', tier: 2, neighbors: ['jianning', 'yunnan'] },
  { id: 'wuwei', name: '무위', region: '량주', tier: 4, neighbors: ['xiping', 'anding', 'tianshui'] },
  { id: 'xiping', name: '서평', region: '량주', tier: 3, neighbors: ['wuwei', 'anding'] },
  { id: 'anding', name: '안정', region: '량주', tier: 3, neighbors: ['chang_an', 'wuwei', 'xiping', 'tianshui'] },
  { id: 'tianshui', name: '천수', region: '량주', tier: 4, neighbors: ['chang_an', 'anding', 'wuwei', 'wudu', 'hanzhong'] },
  { id: 'jiaozhi', name: '교지', region: '교주', tier: 4, neighbors: ['lingling', 'nanhai', 'cangwu'] },
  { id: 'nanhai', name: '남해', region: '교주', tier: 4, neighbors: ['guiyang', 'jiaozhi', 'cangwu'] },
  { id: 'cangwu', name: '창오', region: '교주', tier: 3, neighbors: ['jiaozhi', 'nanhai', 'yulin'] },
  { id: 'yulin', name: '울림', region: '교주', tier: 3, neighbors: ['cangwu', 'hepu'] },
  { id: 'hepu', name: '합포', region: '교주', tier: 2, neighbors: ['yulin'] },
];

const MAJOR_CITY_IDS = new Set([
  'luoyang','chang_an','ye','nanpi','pingyuan','beihai','ji','beiping','xiangping','gungnae','buyeo','mahan','jinhan','byeonhan',
  'jinyang','chenliu','puyang','xuchang','runan','xiapi','xiaopei','guangling','shouchun','hefei','lujiang','jianye','wu','kuaiji','chaisang',
  'wan','xinye','xiangyang','jiangling','jiangxia','changsha','wuling','lingling','guiyang','hanzhong','shangyong','chengdu','zitong','jiangzhou',
  'yongan','jianning','yunnan','yongchang','wuwei','anding','tianshui',
]);

const CITY_FALLBACKS: Record<string, string> = {
  hongnong: 'luoyang', henei: 'luoyang', hedong: 'chang_an', bohai: 'nanpi', julu: 'ye', changshan: 'ye', zhongshan: 'beiping',
  jinan: 'pingyuan', donglai: 'beihai', zhuo: 'ji', dai: 'jinyang', xuantu: 'xiangping', lelang: 'xiangping', daifang: 'mahan',
  okjeo: 'gungnae', dongye: 'jinhan', shangdang: 'jinyang', taishan: 'puyang', qiao: 'xuchang', chen: 'runan', langya: 'xiapi',
  poyang: 'chaisang', wudu: 'hanzhong', fuling: 'jiangzhou', xiping: 'wuwei', jiaozhi: 'guiyang', nanhai: 'guiyang', cangwu: 'guiyang',
  yulin: 'guiyang', hepu: 'guiyang', danyang: 'jianye', bingzhou: 'jinyang', qingzhou: 'beihai', yuexi: 'jianning',
};

export function normalizeScenarioCityId(cityId: string) {
  return MAJOR_CITY_IDS.has(cityId) ? cityId : CITY_FALLBACKS[cityId] ?? 'luoyang';
}

const CITIES = ALL_CITIES.filter(city => MAJOR_CITY_IDS.has(city.id));

function inSet(id: string, values: string[]) {
  return values.includes(id);
}

function ownerAt(id: string, region: string, year: number) {
  if (id === 'gungnae') return year < 197 ? '고구려 · 고국천왕' : year < 227 ? '고구려 · 산상왕' : '고구려 · 동천왕';
  if (id === 'buyeo') return year < 206 ? '부여 · 위구태' : year < 238 ? '부여 · 간위거' : '부여';
  if (id === 'okjeo') return '옥저';
  if (id === 'dongye') return '동예';
  if (id === 'mahan') return '백제';
  if (id === 'jinhan') return '신라';
  if (id === 'byeonhan') return '가야';
  if (id === 'xiangping' || id === 'xuantu' || id === 'lelang' || id === 'daifang') {
    if (year < 190) return '후한 동방군현';
    if (year < 205) return '공손도군';
    if (year < 228) return '요동 공손씨';
    if (year < 238) return '공손연군';
    return '위';
  }
  if (region === '교주') return year < 187 ? '후한 교주' : '사섭군';
  if (year <= 184) {
    if (inSet(id, ['julu', 'runan'])) return '황건군';
    if (id === 'changsha') return '손견군';
    if (id === 'jinyang') return '정원군';
    return '후한 조정';
  }
  if (year <= 190) {
    if (inSet(id, ['luoyang', 'chang_an', 'hongnong'])) return '동탁군';
    if (inSet(id, ['ye', 'julu', 'changshan', 'zhongshan'])) return '한복군';
    if (inSet(id, ['nanpi', 'bohai'])) return '원소군';
    if (inSet(id, ['beiping', 'zhuo'])) return '공손찬군';
    if (id === 'ji') return '유우군';
    if (inSet(id, ['chenliu', 'puyang'])) return '조조군';
    if (inSet(id, ['xiapi', 'xiaopei', 'langya', 'guangling'])) return '도겸군';
    if (inSet(id, ['shouchun', 'runan', 'wan'])) return '원술군';
    if (inSet(id, ['xiangyang', 'xinye', 'jiangling', 'jiangxia', 'wuling', 'lingling', 'guiyang'])) return '유표군';
    if (id === 'changsha') return '손견군';
    if (inSet(id, ['chengdu', 'zitong', 'jiangzhou', 'yongan', 'fuling', 'jianning', 'yunnan', 'yongchang', 'hanzhong'])) return '유언군';
    if (inSet(id, ['wuwei', 'xiping', 'anding', 'tianshui', 'wudu'])) return '마등·한수군';
    return '후한 지방세력';
  }
  if (year <= 194) {
    if (inSet(id, ['chang_an', 'hongnong'])) return '이각·곽사군';
    if (inSet(id, ['ye', 'nanpi', 'bohai', 'julu', 'changshan'])) return '원소군';
    if (inSet(id, ['ji', 'zhuo', 'beiping', 'zhongshan'])) return '공손찬군';
    if (inSet(id, ['chenliu', 'xuchang', 'qiao'])) return '조조군';
    if (id === 'puyang') return '여포군';
    if (inSet(id, ['xiapi', 'xiaopei', 'langya', 'guangling'])) return '유비·도겸군';
    if (inSet(id, ['shouchun', 'runan', 'wan'])) return '원술군';
    if (inSet(id, ['xiangyang', 'xinye', 'jiangling', 'jiangxia', 'changsha', 'wuling', 'lingling', 'guiyang'])) return '유표군';
    if (inSet(id, ['chengdu', 'zitong', 'jiangzhou', 'yongan', 'fuling', 'jianning', 'yunnan', 'yongchang'])) return '유장군';
    if (id === 'hanzhong') return '장로군';
    if (inSet(id, ['wuwei', 'xiping', 'anding', 'tianshui', 'wudu'])) return '마등·한수군';
    return '지방세력';
  }
  if (year <= 200) {
    if (inSet(id, ['ye', 'nanpi', 'bohai', 'julu', 'changshan', 'zhongshan'])) return '원소군';
    if (inSet(id, ['ji', 'zhuo', 'beiping']) && year < 199) return '공손찬군';
    if (inSet(id, ['jianye', 'wu', 'kuaiji', 'lujiang', 'chaisang', 'poyang'])) return year < 200 ? '손책군' : '손권군';
    if (inSet(id, ['xiangyang', 'xinye', 'jiangling', 'jiangxia', 'changsha', 'wuling', 'lingling', 'guiyang'])) return '유표군';
    if (inSet(id, ['chengdu', 'zitong', 'jiangzhou', 'yongan', 'fuling', 'jianning', 'yunnan', 'yongchang'])) return '유장군';
    if (id === 'hanzhong') return '장로군';
    if (inSet(id, ['wuwei', 'xiping', 'anding', 'tianshui', 'wudu'])) return '마등·한수군';
    if (id === 'wan' && year < 200) return '장수군';
    if (inSet(id, ['xiapi', 'xiaopei']) && year < 199) return '여포군';
    return '조조군';
  }
  if (year <= 208) {
    if (inSet(id, ['jianye', 'wu', 'kuaiji', 'lujiang', 'chaisang', 'poyang', 'hefei'])) return id === 'hefei' ? '조조군' : '손권군';
    if (inSet(id, ['xiangyang', 'xinye'])) return '조조군';
    if (inSet(id, ['jiangxia', 'changsha', 'wuling', 'lingling', 'guiyang'])) return '유비·손권 연합';
    if (inSet(id, ['chengdu', 'zitong', 'jiangzhou', 'yongan', 'fuling', 'jianning', 'yunnan', 'yongchang'])) return '유장군';
    if (id === 'hanzhong') return '장로군';
    if (inSet(id, ['wuwei', 'xiping', 'anding', 'tianshui', 'wudu'])) return '마등·한수군';
    return '조조군';
  }
  if (year <= 214) {
    if (inSet(id, ['jianye', 'wu', 'kuaiji', 'lujiang', 'chaisang', 'poyang', 'jiangxia', 'changsha'])) return '손권군';
    if (inSet(id, ['chengdu', 'zitong', 'jiangzhou', 'yongan', 'fuling', 'jianning', 'yunnan', 'yongchang', 'jiangling', 'wuling', 'lingling', 'guiyang'])) return '유비군';
    if (id === 'hanzhong') return '장로군';
    return '조조군';
  }
  if (year <= 219) {
    if (inSet(id, ['jianye', 'wu', 'kuaiji', 'lujiang', 'chaisang', 'poyang', 'jiangxia', 'changsha'])) return '손권군';
    if (inSet(id, ['chengdu', 'zitong', 'jiangzhou', 'yongan', 'fuling', 'jianning', 'yunnan', 'yongchang', 'hanzhong', 'jiangling', 'wuling', 'lingling', 'guiyang'])) return '유비군';
    return '조조군';
  }
  if (year >= 220) {
    if (inSet(id, ['jianye', 'wu', 'kuaiji', 'lujiang', 'chaisang', 'poyang', 'jiangxia', 'changsha', 'wuling', 'lingling', 'guiyang', 'jiangling', 'jiaozhi', 'nanhai', 'cangwu', 'yulin', 'hepu'])) return year >= 229 ? '오' : '손권군';
    if (inSet(id, ['chengdu', 'zitong', 'jiangzhou', 'yongan', 'fuling', 'jianning', 'yunnan', 'yongchang', 'hanzhong'])) return year >= 221 ? '촉' : '유비군';
    return '위';
  }
  return '재야';
}

export function buildScenarioCities(year: number) {
  const activeCities = CITIES.filter(city => !city.availableFrom || year >= city.availableFrom);
  const activeIds = new Set(activeCities.map(city => city.id));
  return activeCities.map(city => {
    const base = 20 + city.tier * 10;
    const neighbors = Array.from(new Set(city.neighbors.map(normalizeScenarioCityId))).filter(neighbor => neighbor !== city.id && activeIds.has(neighbor));
    return {
      id: city.id,
      name: city.name,
      region: city.region,
      tier: city.tier,
      owner: ownerAt(city.id, city.region, year),
      commerce: Math.min(92, base + (city.id.length % 11)),
      agriculture: Math.min(94, base + 4 + (city.name.length % 9)),
      security: Math.min(90, 42 + city.tier * 8),
      population: 32000 + city.tier * 30000,
      troops: 3500 + city.tier * 3200,
      defense: 24 + city.tier * 10,
      neighbors,
    };
  });
}

const O = (
  id: string,
  name: string,
  courtesyName: string,
  force: string,
  city: string,
  activeFrom: number,
  activeTo: number,
  stats: [number, number, number, number, number],
  traits: string[] = [],
  relations: string[] = [],
  gender: '남' | '여' = '남',
  birthYear: number | null = null,
  deathYear: number | null = null
): LegacyOfficerData => ({
  id, name, courtesyName, birthYear, deathYear, gender, force, city, activeFrom, activeTo,
  leadership: stats[0], martial: stats[1], intelligence: stats[2], politics: stats[3], charisma: stats[4],
  traits, relations, portraitKey: id, fullBodyKey: `${id}-full`,
});

const BASE_HISTORIC_OFFICERS_DATA: LegacyOfficerData[] = [
  O('liubei','유비','현덕','유비군','zhuo',184,223,[82,75,78,84,97],['인덕','의형제'],['관우','장비'],'남',161,223),
  O('guanyu','관우','운장','유비군','zhuo',184,220,[93,98,77,64,89],['신의','맹장'],['유비','장비']),
  O('zhangfei','장비','익덕','유비군','zhuo',184,221,[86,99,35,30,63],['호걸','돌격'],['유비','관우']),
  O('zhaoyun','조운','자룡','유비군','changshan',191,229,[91,96,79,65,88],['호위','기병'],['유비','제갈량']),
  O('zhugeliang','제갈량','공명','유비군','xinye',200,234,[94,38,100,98,93],['와룡','군략'],['유비','방통'],'남',181,234),
  O('pangtong','방통','사원','유비군','jiangling',200,214,[86,51,97,85,82],['봉추','기략'],['제갈량','유비']),
  O('fazheng','법정','효직','유비군','chengdu',211,220,[82,49,96,82,72],['모략','기책'],['유비']),
  O('xushu','서서','원직','유비군','xinye',200,234,[73,66,93,79,81],['군사','효행'],['유비','제갈량']),
  O('huangzhong','황충','한승','유비군','changsha',190,220,[88,96,72,55,76],['노장','궁술'],['위연']),
  O('weiyan','위연','문장','유비군','hanzhong',208,234,[92,94,69,52,71],['맹장','기습'],['제갈량']),
  O('guanping','관평','','유비군','jingling',200,220,[79,86,65,55,72],['충의'],['관우']),
  O('liaohua','요화','원검','유비군','jiangling',200,264,[75,74,70,68,73],['노장'],['관우']),
  O('machao','마초','맹기','유비군','wuwei',190,222,[90,97,55,48,88],['금마초','기병'],['마등','마대']),
  O('madai','마대','','유비군','wuwei',200,240,[80,84,68,59,72],['기병'],['마초']),
  O('jiangwei','강유','백약','촉','tianshui',227,264,[92,89,93,81,83],['계승자','북벌'],['제갈량']),
  O('wangping','왕평','자균','촉','hanzhong',215,248,[88,78,82,67,74],['산악전'],['제갈량']),
  O('ma_liang','마량','계상','유비군','jiangling',208,222,[65,32,88,91,83],['외교','정무'],['마속']),
  O('ma_su','마속','유상','촉','chengdu',214,228,[72,54,87,70,69],['병법'],['제갈량','마량']),
  O('jiangwan','장완','공염','촉','chengdu',214,246,[72,35,86,94,83],['재상'],['비의']),
  O('feiyi','비의','문위','촉','chengdu',214,253,[68,33,88,95,90],['외교','재상'],['장완']),
  O('dengzhi','등지','백묘','촉','chengdu',214,251,[73,44,85,90,86],['외교'],['유비']),
  O('dongyun','동윤','휴소','촉','chengdu',220,246,[58,28,82,91,84],['간언'],['제갈량']),
  O('liy an','이엄','정방','촉','jiangzhou',211,234,[82,80,78,84,67],['수비'],['유비']),
  O('wuyi','오의','자원','촉','chengdu',194,237,[80,77,69,73,75],['장군'],['유장']),
  O('zhangyi_shu','장익','백공','촉','chengdu',214,264,[78,75,76,80,70],['치정']),
  O('zhangni','장억','백기','촉','jianning',214,254,[84,82,78,73,78],['남중'],['강유']),
  O('liufeng','유봉','','유비군','shangyong',200,220,[76,84,55,44,66],['용맹'],['유비']),
  O('mengda','맹달','자경','위','shangyong',200,228,[80,74,82,76,71],['변절'],['유봉']),
  O('chen_dao','진도','숙지','촉','yongan',200,240,[84,86,68,61,75],['백이병'],['유비']),
  O('zhug ezhan','제갈첨','사원','촉','chengdu',227,263,[76,67,78,80,84],['충절'],['제갈량']),

  O('caocao','조조','맹덕','조조군','chenliu',184,220,[98,75,94,96,93],['간웅','용병'],['순욱','곽가'],'남',155,220),
  O('caopi','조비','자환','조조군','xuchang',200,226,[82,69,86,92,84],['문치'],['조조'],'남',187,226),
  O('caoang','조앙','자수','조조군','xuchang',190,197,[72,73,65,61,78],['효심'],['조조']),
  O('caoren','조인','자효','조조군','chenliu',190,223,[94,88,74,61,76],['철벽','공성'],['조조']),
  O('caohong','조홍','자렴','조조군','chenliu',190,232,[80,82,58,49,71],['기병'],['조조']),
  O('caochun','조순','자화','조조군','chenliu',190,210,[88,85,71,62,77],['호표기'],['조조']),
  O('caozhen','조진','자단','위','xuchang',200,231,[91,78,78,72,81],['대장군'],['조조']),
  O('caoxiu','조휴','문열','위','xuchang',200,228,[86,81,71,68,78],['기병'],['조조']),
  O('caozhang','조창','자문','조조군','xuchang',200,223,[85,93,58,43,78],['황수아'],['조조']),
  O('xiahoudun','하후돈','원양','조조군','chenliu',190,220,[91,90,71,72,85],['독안장군'],['조조']),
  O('xiahouyuan','하후연','묘재','조조군','chenliu',190,219,[92,91,68,52,76],['급습','기병'],['조조']),
  O('xiahoushang','하후상','백인','위','xuchang',200,225,[82,76,72,68,74],['장군'],['조조']),
  O('xiahouba','하후패','중권','위','xuchang',220,255,[82,84,72,58,75],['기병'],['하후연']),
  O('dianwei','전위','','조조군','chenliu',190,197,[74,99,45,32,72],['악래','호위'],['조조']),
  O('xuchu','허저','중강','조조군','xuchang',195,230,[79,98,48,36,76],['호치','호위'],['조조']),
  O('zhangliao','장료','문원','조조군','xiapi',190,222,[96,95,83,63,86],['위진합비','기병'],['여포','조조']),
  O('yuejin','악진','문겸','조조군','chenliu',190,218,[87,89,65,56,70],['선봉'],['조조']),
  O('yujin','우금','문칙','조조군','chenliu',190,221,[91,82,73,67,67],['엄정'],['조조']),
  O('xuhuang','서황','공명','조조군','hedong',190,227,[94,92,78,68,79],['장구','정예'],['조조']),
  O('lidian','이전','만성','조조군','chenliu',190,215,[82,77,80,74,76],['학식'],['악진']),
  O('zhanghe','장합','준예','조조군','ye',190,231,[94,91,83,69,80],['변진','산악전'],['원소','조조']),
  O('gaolan','고람','','원소군','ye',190,210,[81,84,67,58,66],['맹장'],['장합']),
  O('zangba','장패','선고','조조군','taishan',190,230,[85,81,71,67,75],['태산군'],['조조']),
  O('manchong','만총','백녕','조조군','xuchang',190,242,[84,65,88,89,76],['합비수비'],['조조']),
  O('wenpin','문빙','중업','조조군','xiangyang',190,230,[88,82,73,66,76],['수군','수비'],['유표']),
  O('pangde','방덕','영명','조조군','wuwei',190,219,[87,96,68,51,77],['백마장군'],['마초','조조']),
  O('xunyu','순욱','문약','조조군','xuchang',190,212,[67,28,97,99,94],['왕좌지재','정략'],['조조']),
  O('xunyou','순유','공달','조조군','xuchang',190,214,[70,31,96,91,82],['모사'],['조조']),
  O('guojia','곽가','봉효','조조군','xuchang',190,207,[72,34,99,82,88],['귀모'],['조조']),
  O('chengyu','정욱','중덕','조조군','puyang',190,220,[76,55,93,89,71],['강단'],['조조']),
  O('jiaxu','가후','문화','조조군','wan',189,223,[78,49,99,94,80],['독사','책략'],['장수','조조']),
  O('liuye','유엽','자양','조조군','xuchang',196,234,[72,40,91,90,78],['책략'],['조조']),
  O('simayi','사마의','중달','위','luoyang',200,251,[98,63,99,96,88],['심모','지구전'],['제갈량']),
  O('simafu','사마부','숙달','위','luoyang',208,272,[68,32,84,94,82],['중신'],['사마의']),
  O('simashi','사마사','자원','위','luoyang',227,255,[88,72,91,91,79],['권모'],['사마의']),
  O('simazhao','사마소','자상','위','luoyang',234,265,[87,69,92,94,82],['권모'],['사마의']),
  O('chenqun','진군','장문','조조군','xuchang',196,237,[54,24,88,98,81],['구품관인법'],['조조']),
  O('zhongyao','종요','원상','조조군','chang_an',190,230,[64,37,87,96,79],['서예','정무'],['조조']),
  O('huaxin','화흠','자어','조조군','xuchang',190,232,[52,25,84,95,75],['정무'],['조비']),
  O('wanglang','왕랑','경흥','조조군','kuaiji',190,228,[58,38,82,93,78],['학자'],['조비']),
  O('jiangji','장제','자통','위','shouchun',200,249,[71,45,86,89,72],['책략'],['조조']),
  O('dongzhao','동소','공인','조조군','xuchang',190,236,[64,36,89,92,76],['정략'],['조조']),
  O('yangxiu','양수','덕조','조조군','xuchang',196,219,[45,30,91,84,80],['재사'],['조조']),
  O('maojie','모개','효선','조조군','xuchang',190,216,[55,31,83,92,76],['둔전'],['조조']),
  O('dengai','등애','사재','위','xuchang',227,264,[94,87,92,82,75],['기습','둔전'],['종회']),
  O('zhonghui','종회','사계','위','luoyang',234,264,[88,62,96,92,84],['책략'],['등애']),
  O('guohuai','곽회','백제','위','tianshui',211,255,[89,77,83,75,77],['서방수비'],['사마의']),
  O('haozhao','학소','백도','위','chang_an',220,229,[88,76,79,61,72],['진창수비'],['제갈량']),

  O('yuanshao','원소','본초','원소군','bohai',184,202,[86,72,77,81,93],['명문','대군'],['원술']),
  O('yuantan','원담','현사','원소군','nanpi',190,205,[76,73,61,55,69],['후계분쟁'],['원소']),
  O('yuanxi','원희','현옹','원소군','beiping',190,207,[69,62,59,57,64],['후계분쟁'],['원소']),
  O('yuanshang','원상','현보','원소군','ye',190,207,[79,78,65,58,76],['후계분쟁'],['원소']),
  O('yanliang','안량','','원소군','ye',190,200,[82,96,52,39,70],['맹장'],['문추']),
  O('wenchou','문추','','원소군','ye',190,200,[81,95,48,37,69],['맹장'],['안량']),
  O('jushou','저수','','원소군','ye',190,200,[76,42,94,91,78],['군략'],['원소']),
  O('tianfeng','전풍','원호','원소군','ye',190,200,[69,35,95,92,73],['직간'],['원소']),
  O('shenpei','심배','정남','원소군','ye',190,204,[82,62,83,84,76],['충절','수성'],['원소']),
  O('guotu','곽도','공칙','원소군','ye',190,205,[61,35,80,72,59],['모사'],['원소']),
  O('fengji','봉기','원도','원소군','ye',190,204,[58,31,81,73,61],['모사'],['원소']),
  O('chunyuqiong','순우경','중간','원소군','ye',190,200,[72,72,48,42,55],['오소'],['원소']),

  O('gongsunzan','공손찬','백규','공손찬군','beiping',184,199,[88,91,67,51,82],['백마의종'],['유비']),
  O('tiankai','전해','','공손찬군','pingyuan',190,199,[73,68,58,52,62],['장군'],['공손찬']),
  O('yanGang','엄강','','공손찬군','beiping',190,199,[70,72,45,40,57],['기병'],['공손찬']),
  O('liuyu','유우','백안','유우군','ji',184,193,[65,34,83,94,91],['인망'],['공손찬']),
  O('hanfu','한복','문절','한복군','ye',184,191,[56,43,61,72,66],['기주목'],['원소']),
  O('kongrong','공융','문거','공융군','beihai',184,208,[48,30,85,88,91],['명사','문인'],['조조']),
  O('taoqian','도겸','공조','도겸군','xiapi',184,194,[67,52,70,78,83],['서주목'],['유비']),
  O('liubiao','유표','경승','유표군','xiangyang',190,208,[74,49,83,90,88],['형주목'],['유기','유종']),
  O('liuqi','유기','','유표군','jiangxia',195,209,[67,55,70,68,72],['후계자'],['유표']),
  O('liucong','유종','','유표군','xiangyang',200,220,[52,37,66,70,61],['항복'],['유표']),
  O('liuyan','유언','군랑','유언군','chengdu',184,194,[70,43,82,89,83],['익주목'],['유장']),
  O('liuzhang','유장','계옥','유장군','chengdu',194,214,[54,36,67,76,75],['익주목'],['유언']),
  O('zhanglu','장로','공기','장로군','hanzhong',190,216,[72,55,78,88,84],['오두미도'],['조조']),
  O('zhangxiu','장수','','장수군','wan',190,207,[84,88,66,52,75],['완성'],['가후']),
  O('zhangji','장제','','동탁군','chang_an',189,196,[76,78,52,44,61],['서량군'],['장수']),
  O('lijue','이각','치연','이각군','chang_an',189,198,[74,82,48,38,52],['서량군'],['곽사']),
  O('guosi','곽사','','곽사군','chang_an',189,197,[72,80,44,35,49],['서량군'],['이각']),
  O('fanchou','번조','','동탁군','chang_an',189,195,[70,78,43,36,50],['서량군'],['동탁']),
  O('niufu','우보','','동탁군','chang_an',189,192,[68,73,39,34,48],['서량군'],['동탁']),
  O('huaxiong','화웅','','동탁군','luoyang',189,191,[78,93,48,35,67],['맹장'],['동탁']),
  O('dongzhuo','동탁','중영','동탁군','luoyang',184,192,[88,89,67,59,43],['폭정','서량군'],['여포']),
  O('lvbu','여포','봉선','여포군','luoyang',184,199,[88,100,31,24,74],['비장','일기당천'],['동탁','진궁']),
  O('chengong','진궁','공대','여포군','puyang',190,199,[82,54,94,81,75],['군사'],['여포']),
  O('gaoshun','고순','','여포군','xiapi',190,199,[91,89,67,56,73],['함진영'],['여포']),
  O('weixu','위속','','여포군','xiapi',190,199,[67,70,46,39,52],['장군'],['여포']),
  O('songxian','송헌','','여포군','xiapi',190,199,[65,69,45,38,50],['장군'],['여포']),
  O('houcheng','후성','','여포군','xiapi',190,199,[66,68,48,41,54],['장군'],['여포']),
  O('zhangmiao','장막','맹탁','장막군','chenliu',184,195,[68,48,76,81,80],['연주명사'],['조조','진궁']),

  O('sunjian','손견','문대','손견군','changsha',184,191,[95,95,78,70,90],['강동의 호랑이'],['손책','손권'],'남',155,191),
  O('sunce','손책','백부','손책군','lujiang',194,200,[94,96,77,71,94],['소패왕'],['주유','손권'],'남',175,200),
  O('sunquan','손권','중모','손권군','jianye',200,252,[84,69,87,92,93],['수성','인재등용'],['손책','주유'],'남',182,252),
  O('zhouyu','주유','공근','손권군','chaisang',194,210,[97,72,98,89,96],['대도독','수군'],['손책','손권']),
  O('lusu','노숙','자경','손권군','chaisang',200,217,[85,52,94,93,91],['대전략','외교'],['주유','여몽']),
  O('lvmeng','여몽','자명','손권군','jiangxia',195,220,[93,87,91,83,82],['괄목상대'],['손권','육손']),
  O('luxun','육손','백언','손권군','jianye',208,245,[98,69,97,93,89],['화공','대도독'],['손권']),
  O('chengpu','정보','덕모','손권군','changsha',184,210,[88,84,72,63,80],['숙장'],['손견']),
  O('huanggai','황개','공복','손권군','changsha',184,220,[84,88,72,55,77],['고육계'],['주유']),
  O('handang','한당','의공','손권군','changsha',184,227,[83,86,65,54,73],['숙장'],['손견']),
  O('zumao','조무','대영','손견군','changsha',184,191,[71,82,51,42,68],['호위'],['손견']),
  O('taishici','태사자','자의','손권군','beihai',190,206,[88,95,78,61,86],['신궁'],['손책']),
  O('ganning','감녕','흥패','손권군','jiangxia',195,220,[88,96,76,56,81],['금범적'],['손권']),
  O('zhoutai','주태','유평','손권군','jianye',195,230,[82,94,63,45,79],['호위'],['손권']),
  O('jiangqin','장흠','공혁','손권군','jianye',195,219,[81,84,67,55,72],['수군'],['손권']),
  O('lingcao','능조','','손책군','wu',194,203,[78,85,55,44,68],['선봉'],['능통']),
  O('lingtong','능통','공적','손권군','wu',203,237,[86,91,73,59,78],['선봉'],['감녕']),
  O('xusheng','서성','문향','손권군','jianye',200,228,[87,88,76,61,76],['방위'],['손권']),
  O('dingfeng','정봉','승연','오','jianye',208,271,[88,90,74,61,78],['노장'],['손권']),
  O('dongxi','동습','원대','손권군','wu',195,213,[79,85,59,48,70],['수군'],['손권']),
  O('chenwu','진무','자열','손권군','jianye',195,215,[78,89,56,45,71],['맹장'],['손권']),
  O('panzhang','반장','문규','손권군','jiangling',200,234,[80,85,58,52,62],['포획'],['손권']),
  O('zhuran','주연','의봉','손권군','jiangling',208,249,[89,82,81,70,75],['수비'],['손권']),
  O('zhuhuan','주환','휴목','손권군','hefei',208,238,[90,85,83,66,78],['수비'],['손권']),
  O('qu ancong','전종','자황','손권군','jianye',208,249,[83,79,74,70,80],['장군'],['손권']),
  O('heqi','하제','공묘','손권군','kuaiji',195,227,[84,82,76,70,78],['산월토벌'],['손권']),
  O('buzhi','보즐','자산','손권군','jiaozhi',200,247,[69,34,85,92,81],['교주경영'],['손권']),
  O('zhangzhao','장소','자포','손권군','jianye',194,236,[54,24,91,98,89],['내정','고명'],['손책','손권']),
  O('zhanghong','장굉','자강','손권군','jianye',194,211,[51,23,89,95,86],['내정'],['손책']),
  O('guyong','고옹','원탄','손권군','jianye',200,243,[53,25,86,96,83],['재상'],['손권']),
  O('kanze','감택','덕윤','손권군','jianye',200,243,[48,22,88,92,82],['학자','외교'],['손권']),
  O('yufan','우번','중상','손권군','kuaiji',195,233,[55,35,91,87,72],['논객'],['손권']),
  O('zhugejin','제갈근','자유','손권군','jianye',200,241,[70,37,87,93,90],['외교'],['제갈량']),
  O('lufan','여범','자형','손권군','jianye',194,228,[75,61,78,86,80],['재정'],['손책']),

  O('mateng','마등','수성','마등군','wuwei',184,212,[82,86,62,60,82],['서량기병'],['마초','한수']),
  O('hansui','한수','문약','한수군','xiping',184,215,[83,75,87,78,75],['서량군'],['마등']),
  O('matie','마철','','마등군','wuwei',195,212,[70,75,52,44,63],['기병'],['마초']),
  O('maxiu','마휴','','마등군','wuwei',195,212,[72,77,53,45,64],['기병'],['마초']),
  O('gongsundu','공손도','승제','공손도군','xiangping',190,204,[80,73,78,83,78],['요동경영'],['공손강'],'남',150,204),
  O('gongsunkang','공손강','','요동 공손씨','xiangping',204,220,[78,70,76,79,72],['요동경영'],['공손도']),
  O('gongsungong','공손공','','요동 공손씨','xiangping',220,228,[55,43,62,67,58],['요동'],['공손강']),
  O('gongsunyuan','공손연','문유','공손연군','xiangping',228,238,[78,69,71,70,67],['요동반란'],['사마의']),

  O('hej in','하진','수고','후한 조정','luoyang',184,189,[68,63,55,62,70],['대장군'],['원소']),
  O('huangfusong','황보숭','의진','후한 조정','luoyang',184,195,[95,84,88,82,89],['황건토벌'],['주준']),
  O('zhujun','주준','공위','후한 조정','luoyang',184,195,[90,82,79,78,82],['황건토벌'],['황보숭']),
  O('luzhi','노식','자간','후한 조정','luoyang',184,192,[84,62,88,92,90],['명사','황건토벌'],['유비']),
  O('wangyun','왕윤','자사','후한 조정','chang_an',184,192,[61,31,88,91,79],['연환계'],['여포']),
  O('caiyong','채옹','백개','후한 조정','luoyang',184,192,[35,20,88,94,87],['문인'],['채염']),
  O('caiyan','채염','문희','재야','luoyang',190,239,[28,18,89,84,90],['문학','음률'],['채옹'],'여'),
  O('dingyuan','정원','건양','정원군','jinyang',184,189,[76,78,63,61,67],['병주목'],['여포']),
  O('qiaomao','교모','원위','연합군','chenliu',184,191,[64,48,68,72,70],['반동탁'],['원소']),
  O('baoxin','포신','윤성','조조군','puyang',184,192,[77,68,75,73,78],['반동탁'],['조조']),
  O('wangkuang','왕광','공절','연합군','henei',184,191,[68,61,64,67,67],['반동탁'],['원소']),
  O('liudai','유대','공산','연합군','puyang',184,192,[64,54,68,73,72],['연주자사'],['조조']),
  O('yuanshu','원술','공로','원술군','shouchun',184,199,[73,64,67,72,78],['참칭'],['원소']),
  O('ji ling','기령','','원술군','shouchun',190,199,[79,87,55,46,64],['맹장'],['원술']),
  O('leibo','뇌박','','원술군','shouchun',190,200,[64,70,45,39,49],['장군'],['원술']),
  O('chenlan','진란','','원술군','shouchun',190,209,[67,72,47,41,51],['장군'],['원술']),

  O('zhangjiao','장각','','황건군','julu',184,184,[83,56,90,78,94],['천공장군','태평도'],['장보','장량']),
  O('zhangbao','장보','','황건군','julu',184,184,[75,71,66,53,76],['지공장군'],['장각']),
  O('zhangliang_yellow','장량','','황건군','julu',184,184,[74,73,62,49,73],['인공장군'],['장각']),
  O('bocai','파재','','황건군','runan',184,184,[73,77,52,42,66],['황건장수'],['장각']),
  O('heyi','하의','','황건 잔당','runan',184,197,[65,69,44,36,55],['황건잔당'],[]),
  O('huangshao','황소','','황건 잔당','runan',184,196,[64,68,43,35,53],['황건잔당'],[]),
  O('gongdu','공도','','황건 잔당','runan',184,201,[68,71,48,40,57],['황건잔당'],['유비']),
  O('liupi','유벽','','황건 잔당','runan',184,201,[69,73,47,39,59],['황건잔당'],['유비']),

  O('shixie','사섭','위언','사섭군','jiaozhi',187,226,[70,38,84,95,91],['교주왕','학식'],[]),
  O('shiyi','사일','','사섭군','nanhai',187,226,[55,35,68,78,70],['교주'],['사섭']),
  O('shiwu','사무','','사섭군','cangwu',187,226,[57,42,63,71,66],['교주'],['사섭']),
  O('menghuo','맹획','','남중세력','jianning',220,240,[79,87,63,55,84],['남만왕'],['축융']),
  O('zhurong','축융','','남중세력','jianning',220,240,[73,91,61,47,82],['비도'],['맹획'],'여'),
  O('mengyou','맹우','','남중세력','jianning',220,240,[68,76,52,45,65],['남중'],['맹획']),
  O('shamoke','사마가','','오계만','wuling',210,222,[72,89,52,38,69],['이민족장'],[]),

  O('gogukcheon','고국천왕','남무','고구려 · 고국천왕','gungnae',179,197,[86,82,80,88,89],['고구려왕','진대법'],['산상왕']),
  O('sansang','산상왕','연우','고구려 · 산상왕','gungnae',197,227,[84,80,78,83,85],['고구려왕'],['고국천왕','동천왕']),
  O('dongcheon','동천왕','우위거','고구려 · 동천왕','gungnae',227,248,[90,86,79,75,88],['고구려왕'],['산상왕']),
  O('balgi','발기','','고구려','gungnae',197,197,[72,77,62,55,63],['왕족'],['산상왕']),
  O('gyesu','계수','','고구려','gungnae',184,220,[82,85,72,65,78],['왕족','요동군격퇴'],['고국천왕','산상왕']),
  O('eulpaso','을파소','','고구려','gungnae',191,203,[72,38,94,98,91],['국상','진대법'],['고국천왕']),
  O('anryu','안류','','고구려','gungnae',191,220,[65,42,86,88,84],['대사자','인재천거'],['을파소']),
  O('jwagaryeo','좌가려','','고구려','gungnae',190,191,[62,55,68,44,52],['반란'],['어비류']),
  O('eobiryu','어비류','','고구려','gungnae',190,191,[61,58,64,45,50],['반란'],['좌가려']),
  O('gouru','고우루','','고구려','gungnae',203,230,[76,54,84,91,83],['국상'],['을파소']),
  O('wigutae','위구태','','부여 · 위구태','buyeo',180,205,[82,78,75,84,86],['부여왕','요동연계'],['공손도']),
  O('ganwigeo','간위거','','부여 · 간위거','buyeo',206,238,[78,72,71,80,79],['부여왕'],['위구태']),
  O('mayeo','마여','','부여','buyeo',238,260,[77,68,71,78,80],['부여왕'],['간위거']),
  O('chogo','초고왕','','백제','mahan',184,214,[84,78,72,81,86],['백제왕'],['진과']),
  O('jinga_baekje','진과','','백제','mahan',214,234,[78,82,62,55,72],['장군','석문성공략'],['초고왕']),
  O('gusu','구수왕','','백제','mahan',214,234,[82,76,69,78,83],['백제왕'],['초고왕']),
  O('beolhyu','벌휴이사금','','신라','jinhan',184,196,[79,63,82,84,87],['신라왕'],[]),
  O('naehae','내해이사금','','신라','jinhan',196,230,[82,72,76,82,88],['신라왕'],['우로']),
  O('naeum','내음','','신라','jinhan',207,220,[88,84,72,68,80],['군국정사','장군'],['내해이사금']),
  O('uro_silla','우로','','신라','jinhan',209,253,[90,91,73,64,84],['각간','명장'],['내해이사금']),
  O('mulgyeja','물계자','','신라','jinhan',209,235,[81,90,68,55,82],['포상팔국전쟁'],['내해이사금']),
  O('seolbu','설부','','신라','jinhan',204,214,[72,76,58,55,70],['장군'],['내해이사금']),
  O('suro_gaya','수로왕','','가야','byeonhan',184,199,[83,67,75,87,92],['금관가야왕'],[]),
  O('geodeung','거등왕','','가야','byeonhan',199,253,[79,65,72,82,85],['금관가야왕'],['수로왕']),
];

function cleanOfficerDisplayName(name: string) {
  return name.replace(/_[^_]+$/u, '').trim();
}

BASE_HISTORIC_OFFICERS_DATA.push(...EXTRA_OFFICERS_DATA);

// Match one ROTK reference row to each already-curated officer, then add the remaining
// reference rows as individually-valued historical officers. This preserves curated balancing
// while expanding the world toward the 1,000-officer reference roster without duplicate stars.
const matchedReferenceIds = new Set<string>();
for (const officer of BASE_HISTORIC_OFFICERS_DATA) {
  const match = resolveReferenceProfile(cleanOfficerDisplayName(officer.name), officer.activeFrom, officer.activeTo);
  if (match) matchedReferenceIds.add(match.id);
}
for (const reference of REFERENCE_OFFICERS_DATA) {
  if (matchedReferenceIds.has(reference.id)) continue;
  BASE_HISTORIC_OFFICERS_DATA.push({
    id: reference.id,
    name: reference.name,
    courtesyName: '',
    birthYear: reference.birthYear,
    deathYear: reference.deathYear,
    gender: '남',
    force: reference.force,
    city: reference.city,
    activeFrom: reference.activeFrom,
    activeTo: reference.activeTo,
    leadership: reference.leadership,
    martial: reference.martial,
    intelligence: reference.intelligence,
    politics: reference.politics,
    charisma: reference.charisma,
    traits: ['삼국지14참조'],
    relations: [],
    portraitKey: reference.id,
    fullBodyKey: `${reference.id}-full`,
  });
}

// Curated and reference-roster officers are valid player-character candidates. The large
// complete-roster preset expansion remains world NPC data only.
const PLAYER_SELECTABLE_SOURCE_IDS = new Set(BASE_HISTORIC_OFFICERS_DATA.map(officer => officer.id));
const WORLD_NPC_ONLY_IDS = new Set([
  'gogukcheon','sansang','dongcheon','balgi','gyesu','eulpaso','anryu','jwagaryeo','eobiryu','gouru',
  'wigutae','ganwigeo','mayeo','chogo','jinga_baekje','gusu','beolhyu','naehae','naeum','uro_silla','mulgyeja','seolbu','suro_gaya','geodeung',
]);

for (const officer of COMPLETE_OFFICERS_DATA) {
  const cleanName = cleanOfficerDisplayName(officer.name);
  const duplicate = BASE_HISTORIC_OFFICERS_DATA.some(existing => existing.id === officer.id || cleanOfficerDisplayName(existing.name) === cleanName);
  if (!duplicate) BASE_HISTORIC_OFFICERS_DATA.push(officer);
}

const VERIFIED_BIRTH_YEAR_OVERRIDES: Record<string, number> = {
  pangtong: 179, guojia: 170, xunyu: 163, xunyou: 157, jiaxu: 147, simayi: 179, caoren: 168, zhangliao: 169,
  caozhi: 192, caochong: 196, zhouyu: 175, lusu: 172, lvmeng: 178, luxun: 183, taishici: 166, zhangzhao: 156,
  guyong: 168, liushan: 207, caiyong: 132, xinxianying: 191, zhangchunhua: 189, wangyuanji: 217,
};

export function isPlayableHistoricOfficer(id: string) {
  return PLAYER_SELECTABLE_SOURCE_IDS.has(id) && !WORLD_NPC_ONLY_IDS.has(id);
}

export const HISTORIC_OFFICERS_DATA: OfficerData[] = BASE_HISTORIC_OFFICERS_DATA.map(officer => {
  const cleanName = cleanOfficerDisplayName(officer.name);
  const reference = resolveReferenceProfile(cleanName, officer.activeFrom, officer.activeTo);
  const verifiedBirthYear = VERIFIED_BIRTH_YEAR_OVERRIDES[officer.id];
  const normalized: LegacyOfficerData = {
    ...officer,
    name: cleanName,
    birthYear: reference?.birthYear ?? verifiedBirthYear ?? officer.birthYear,
    deathYear: reference?.deathYear ?? officer.deathYear,
    activeFrom: reference?.activeFrom ?? officer.activeFrom,
    activeTo: reference?.deathYear ?? officer.activeTo,
    birthYearEstimated: undefined,
  };
  return enrichOfficer(normalized);
});

const PLACEMENTS: Record<string, Array<[number, number, string, string]>> = {
  zhugeliang: [[200,206,'재야','xinye']],
  pangtong: [[200,207,'재야','xiangyang']],
  guojia: [[190,195,'재야','xuchang']],
  simayi: [[200,207,'재야','luoyang']],
  liubei: [[184,189,'유비군','zhuo'],[190,193,'유비군','pingyuan'],[194,198,'유비군','xiaopei'],[199,207,'유비군','runan'],[208,210,'유비군','xinye'],[211,213,'유비군','jiangling'],[214,223,'유비군','chengdu']],
  guanyu: [[184,189,'유비군','zhuo'],[190,193,'유비군','pingyuan'],[194,198,'유비군','xiaopei'],[199,207,'유비군','runan'],[208,219,'유비군','jiangling']],
  zhangfei: [[184,189,'유비군','zhuo'],[190,193,'유비군','pingyuan'],[194,198,'유비군','xiaopei'],[199,207,'유비군','runan'],[208,213,'유비군','jiangling'],[214,221,'유비군','chengdu']],
  zhaoyun: [[191,198,'공손찬군','beiping'],[199,207,'유비군','runan'],[208,213,'유비군','jiangling'],[214,229,'촉','chengdu']],
  caocao: [[184,189,'후한 조정','chenliu'],[190,195,'조조군','chenliu'],[196,220,'조조군','xuchang']],
  zhangliao: [[190,192,'동탁군','luoyang'],[193,199,'여포군','xiapi'],[200,222,'조조군','hefei']],
  zhanghe: [[190,200,'원소군','ye'],[201,231,'조조군','xuchang']],
  jiaxu: [[189,192,'동탁군','chang_an'],[193,196,'이각·곽사군','chang_an'],[197,199,'장수군','wan'],[200,223,'조조군','xuchang']],
  pangde: [[190,214,'마등·한수군','wuwei'],[215,218,'조조군','hanzhong'],[219,219,'조조군','xiangyang']],
  machao: [[190,213,'마등·한수군','wuwei'],[214,222,'유비군','chengdu']],
  sunce: [[194,194,'원술군','lujiang'],[195,200,'손책군','jianye']],
  sunquan: [[200,228,'손권군','jianye'],[229,252,'오','jianye']],
  lvbu: [[184,188,'정원군','jinyang'],[189,191,'동탁군','luoyang'],[192,193,'여포군','chang_an'],[194,195,'여포군','puyang'],[196,199,'여포군','xiapi']],
  xushu: [[200,205,'재야','xinye'],[206,207,'유비군','xinye'],[208,234,'조조군','xuchang']],
  mengda: [[200,219,'유비군','shangyong'],[220,227,'위','shangyong'],[228,228,'촉 귀순시도','shangyong']],
  jiangwei: [[227,228,'위','tianshui'],[229,264,'촉','chengdu']],
  gongsundu: [[190,204,'공손도군','xiangping']],
  gongsunkang: [[204,220,'요동 공손씨','xiangping']],
  gongsungong: [[220,228,'요동 공손씨','xiangping']],
  gongsunyuan: [[228,238,'공손연군','xiangping']],
};

export function getOfficerPlacement(id: string, year: number) {
  const officer = HISTORIC_OFFICERS_DATA.find(entry => entry.id === id);
  const timeline = PLACEMENTS[id];
  const match = timeline?.find(([from, to]) => year >= from && year <= to);
  if (match) return { force: match[2], city: normalizeScenarioCityId(match[3]) };
  return { force: officer?.force ?? '재야', city: normalizeScenarioCityId(officer?.city ?? 'luoyang') };
}

export function buildScenarioGenerals(year: number) {
  return HISTORIC_OFFICERS_DATA
    .filter(officer => year >= officer.activeFrom && year <= officer.activeTo)
    .map(officer => {
      const placement = getOfficerPlacement(officer.id, year);
      return {
        id: officer.id,
        name: officer.name,
        birthYear: officer.birthYear,
        birthYearEstimated: officer.birthYearEstimated,
        deathYear: officer.deathYear,
        gender: officer.gender,
        force: placement.force,
        city: placement.city,
        leadership: officer.leadership,
        martial: officer.martial,
        intelligence: officer.intelligence,
        militaryStrategy: officer.militaryStrategy,
        politics: officer.politics,
        diplomacy: officer.diplomacy,
        personnel: officer.personnel,
        charisma: officer.charisma,
        specialties: { ...officer.specialties },
        traits: [...officer.traits],
        tendencies: [...officer.tendencies],
        relations: [...officer.relations],
        loyalty: 100,
        equipment: {},
      };
    });
}

export function buildDebutingGenerals(year: number) {
  return buildScenarioGenerals(year).filter(general => {
    const officer = HISTORIC_OFFICERS_DATA.find(entry => entry.id === general.id);
    return officer?.activeFrom === year;
  });
}

export const HISTORICAL_DATA_SUMMARY = {
  cities: CITIES.length,
  officers: HISTORIC_OFFICERS_DATA.length,
  reference184Pool: REFERENCE_SCENARIO_COUNTS[184],
  reference221Pool: REFERENCE_SCENARIO_COUNTS[221],
  koreanCenters: ['국내성','부여성','낙랑','대방','옥저','동예','위례성','금성','가야'],
};
