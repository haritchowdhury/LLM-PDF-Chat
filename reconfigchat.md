<>
{!isConnected && upload !== "undefined" && (
<>
<div className="bg-black gap-3 text-white border-none w-full p-4 flex flex-col items-center">
<div>
<ConnectWallet />
</div>
<small>Connect Wallet to Access Quiz!</small>
</div>
<hr className="m-0 border-gray-800" />
</>
)}
{isConnected && (
<>
<CardContent className="text-white bg-black flex-shrink-0 flex justify-center items-center p-0 pb-0 mb-0">
{lockedIn &&
isConnected &&
!loadingMilestones &&
upload !== "undefined" && (
<div className="w-full px-2 py-4 bg-black">
<QuizForm
topic={""}
id={upload}
showLoader={showLoader}
setShowLoader={setShowLoader}
/>
</div>
)}
{isConnected && loadingMilestones && !lockedIn && (
<div className="p-4 flex justify-center">
<motion.div className="w-5 h-5 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
</div>
)}
{isConnected &&
!loadingMilestones &&
!lockedIn &&
upload != "undefined" && (
<div className="w-full px-2 py-8 bg-black">
<CreateMilestones
                              id={upload}
                              sessionId={sessionId}
                              namespace={namespace}
                            />
</div>
)}
</CardContent>
<hr className="m-0 border-gray-800" />
</>
)}
</>
