import { JwtPair, UserInfo } from "/#/store";
import { GO_VIEW_CHAHE_KEY, GO_VIEW_TOKEN_KEY, GO_VIEW_USER_INFO_KEY } from "/@/enums/cacheEnum";



export function setGoViewStoreToken(token: JwtPair| undefined | null) {
   const storeInfo = getGoViewStoreItem();
   if(token){
        storeInfo[GO_VIEW_TOKEN_KEY] = token
    } else {
        delete storeInfo[GO_VIEW_TOKEN_KEY]
    }
   window.localStorage.setItem(GO_VIEW_CHAHE_KEY, JSON.stringify(storeInfo));
}

export function setGoViewStoreUserInfo(userInfo: UserInfo | null){
    const storeInfo = getGoViewStoreItem();
    if(userInfo){
       storeInfo[GO_VIEW_USER_INFO_KEY] = userInfo
    } else {
       delete storeInfo[GO_VIEW_USER_INFO_KEY]
    }
    window.localStorage.setItem(GO_VIEW_CHAHE_KEY, JSON.stringify(storeInfo));
}

export function getGoViewStoreItem(){
    const item = window.localStorage.getItem(GO_VIEW_CHAHE_KEY)
    try {
        return item ? JSON.parse(item) : {}
    } catch (err) {
        return {}
    }
}

export function clearGoviewStore(){
    window.localStorage.removeItem(GO_VIEW_CHAHE_KEY);
}