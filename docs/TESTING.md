# 驗證入口

Node 執行 npm test：全部資料模型測試。安裝 package.json 的 Playwright 並提供 Microsoft Edge 後執行 npm run test:browser。
目前瀏覽器驗收為 emotion-v25-browser、education-browser、sync-browser、list-browser。
emotion-v09-browser、emotion-hints-browser、browser、spec-browser 為歷史流程腳本，保留供追溯，不能當本版驗收入口；v2.5 由新的完整測試取代。
目錄搬移後的模型引用及現行測試伺服器已調整。根 index.html 是產生檔；執行 npm run build 後不應有差異。
舊 education-browser 原先尋找已不存在的 autonomy-stage，已改驗證現行可省略的自主階段為 null；list-browser 的固定日期改相對日期以免測試資料被保存期限刪掉。
單機版無法在頁面关闭時執行期限清理；載入、每次資料操作、匯入與開啟後每分鐘處理。已核准刪除的非敏感識別清單在此瀏覽器持續保留以防舊備份復活，移除瀏覽器資料即失去此保護。
