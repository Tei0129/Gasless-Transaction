import React, { useState, useCallback, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { useSmartAccountContext } from "./contexts/SmartAccountContext";
import { useWeb3AuthContext } from "./contexts/SocialLoginContext";
import { ethers } from "ethers";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

import {
  configInfo as config,
  showErrorMessage,
  showSuccessMessage,
} from "./utils";

import Button from "./components/Button";

const App: React.FC = () => {
  const classes = useStyles();
  const {
    address,
    loading: eoaLoading,
    userInfo,
    connect,
    disconnect,
    getUserInfo,
  } = useWeb3AuthContext();
  const {
    selectedAccount,
    loading: scwLoading,
    setSelectedAccount,
  } = useSmartAccountContext();

  const { web3Provider } = useWeb3AuthContext();
  const { state: walletState, wallet } = useSmartAccountContext();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  const [recAdd, setRecAdd] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [showMainForm, setShowMainForm] = useState(0);

  const recAddChanged = (e: any) => {
    setRecAdd(e.target.value);
  }

  const amountChanged = (e: any) => {
    setAmount(e.target.value);
  }

  const getBalance = async () => {
    if (!walletState?.address || !web3Provider) return;
    console.log('Test ====>  ', walletState)
    const erc20Contract = new ethers.Contract(
      config.terc20.address,
      config.terc20.abi,
      web3Provider
    );
    const count = await erc20Contract.balanceOf(walletState?.address);
    console.log("Debug ====> count", Number(count));
    setBalance(Number(count));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  };

  useEffect(() => {
    getBalance();
  }, [getBalance, web3Provider]);

  const sendClicked = async () => {
    if (!wallet || !walletState || !web3Provider) return;
    try {
      setLoading(true);
      let smartAccount = wallet;
      const erc20Contract = new ethers.Contract(
        config.terc20.address,
        config.terc20.abi,
        web3Provider
      );
      // const amountGwei = ethers.utils.formatUnits(amount, 6);
      const amountGwei = Number(amount) * 1e6;
      console.log('Debug =====> AmountGwei', amountGwei)
      console.log('Debug =====> RecAddr', recAdd)
      const data = await erc20Contract.populateTransaction.transfer(
        recAdd,
        `${amountGwei}`,
      );
      const tx = {
        to: config.terc20.address,
        data: data.data,
      };
      console.log('Debug ====> Tx Generated', tx)
      const txResponse = await smartAccount.sendTransaction({
        transaction: tx,
      });
      console.log("userOpHash", txResponse);
      const txHash = await txResponse.wait();
      console.log("txHash", txHash);
      showSuccessMessage(
        `Transfered ERC20 ${txHash.transactionHash}`,
        txHash.transactionHash
      );
      setLoading(false);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      getBalance();
    } catch (err: any) {
      console.error(err);
      setLoading(false);
      showErrorMessage(err.message || "Error in sending the transaction");
    }
  };

  console.log("address", address);
  console.log("userInfo----------------:", userInfo)

  return (
    <>
      <div className={classes.bgCover}>
        <main className={classes.container}>
          <h1>Select Wallet Address</h1>
          <Button
            onClickFunc={
              !address
                ? () => {
                  connect();
                  setShowMainForm(1);
                }
                : () => {
                  setSelectedAccount(null);
                  disconnect();
                }
            }
            title={!address ? "Connect Wallet" : "Disconnect Wallet"}
          />

          {eoaLoading && <h2>Loading EOA...</h2>}

          {address && (
            <div>
              <h2>EOA Address</h2>
              <p>{address}</p>
            </div>
          )}

          {scwLoading && <h2>Loading Smart Account...</h2>}

          {selectedAccount && address && (
            <div>
              <h2>Smart Account Address</h2>
              <p>{selectedAccount.smartAccountAddress}</p>
            </div>
          )}

          {/* {address && (
          <Button onClickFunc={() => getUserInfo()} title="Get User Info" />
        )}

        {userInfo && (
          <div style={{ maxWidth: 800, wordBreak: "break-all" }}>
            <h2>User Info</h2>
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {JSON.stringify(userInfo, null, 2)}
            </pre>
          </div>
        )} */}

          <div className={showMainForm ? "block" : "none"}>
            <div>
              <input placeholder="Recepient Address" className="myInput" onChange={recAddChanged} value={recAdd} />
            </div>
            <div>
              <input placeholder="Amount" className="myInput1" onChange={amountChanged} value={amount} />
            </div>
            <Button isLoading={loading} onClickFunc={() => sendClicked()} title="----------------------------------Send--------------------------------->" />
          </div>
        </main>
      </div>

      <ToastContainer position="bottom-left" newestOnTop theme="dark" />
    </>
  );
};

const useStyles = makeStyles(() => ({
  bgCover: {
    backgroundColor: "#1a1e23",
    backgroundSize: "cover",
    width: "100%",
    minHeight: "100vh",
    color: "#fff",
    fontStyle: "italic",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    minHeight: "80vh",
    height: 'auto',
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    marginBottom: 50,
    fontSize: 60,
    background: "linear-gradient(90deg, #12ECB8 -2.21%, #00B4ED 92.02%)",
    "-webkit-background-clip": "text",
    "-webkit-text-fill-color": "transparent",
  },
  animateBlink: {
    animation: "$bottom_up 2s linear infinite",
    "&:hover": {
      transform: "scale(1.2)",
    },
  },
  "@keyframes bottom_up": {
    "0%": {
      transform: "translateY(0px)",
    },
    "25%": {
      transform: "translateY(20px)",
    },
    "50%": {
      transform: "translateY(0px)",
    },
    "75%": {
      transform: "translateY(-20px)",
    },
    "100%": {
      transform: "translateY(0px)",
    },
  },
}));

export default App;
