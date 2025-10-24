"""
AlgoMart Escrow Smart Contract
PyTeal Stateful Application for Secure Marketplace Transactions

This contract manages escrow for marketplace transactions:
- Buyer funds the escrow
- Seller receives payment after buyer confirmation
- Optional timeout for automatic refund

To compile this contract:
1. Install PyTeal: pip install pyteal
2. Run: python escrow.py > escrow.teal
3. Deploy using Algorand CLI or SDK

Global State Schema:
- buyer (bytes): Buyer's Algorand address
- seller (bytes): Seller's Algorand address
- amount (uint): Escrow amount in microAlgos
- status (bytes): Current status (CREATED, FUNDED, COMPLETED, REFUNDED)
- timeout (uint): Block number for timeout
"""

from pyteal import *

def approval_program():
    # Global state keys
    buyer_key = Bytes("buyer")
    seller_key = Bytes("seller")
    amount_key = Bytes("amount")
    status_key = Bytes("status")
    timeout_key = Bytes("timeout")

    # Status values
    status_created = Bytes("CREATED")
    status_funded = Bytes("FUNDED")
    status_completed = Bytes("COMPLETED")
    status_refunded = Bytes("REFUNDED")

    # Initialize the escrow contract
    on_creation = Seq([
        App.globalPut(buyer_key, Txn.application_args[0]),
        App.globalPut(seller_key, Txn.application_args[1]),
        App.globalPut(amount_key, Btoi(Txn.application_args[2])),
        App.globalPut(status_key, status_created),
        App.globalPut(timeout_key, Global.latest_timestamp() + Int(86400)),
        Approve()
    ])

    # Buyer funds the escrow
    on_fund = Seq([
        Assert(Txn.sender() == App.globalGet(buyer_key)),
        Assert(App.globalGet(status_key) == status_created),
        Assert(Gtxn[0].type_enum() == TxnType.Payment),
        Assert(Gtxn[0].receiver() == Global.current_application_address()),
        Assert(Gtxn[0].amount() == App.globalGet(amount_key)),
        App.globalPut(status_key, status_funded),
        Approve()
    ])

    # Buyer confirms receipt and releases funds to seller
    on_confirm = Seq([
        Assert(Txn.sender() == App.globalGet(buyer_key)),
        Assert(App.globalGet(status_key) == status_funded),
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver: App.globalGet(seller_key),
            TxnField.amount: App.globalGet(amount_key) - Int(1000),
            TxnField.fee: Int(1000),
        }),
        InnerTxnBuilder.Submit(),
        App.globalPut(status_key, status_completed),
        Approve()
    ])

    # Refund buyer if timeout expires
    on_refund = Seq([
        Assert(
            Or(
                Txn.sender() == App.globalGet(buyer_key),
                Global.latest_timestamp() > App.globalGet(timeout_key)
            )
        ),
        Assert(App.globalGet(status_key) == status_funded),
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver: App.globalGet(buyer_key),
            TxnField.amount: App.globalGet(amount_key) - Int(1000),
            TxnField.fee: Int(1000),
        }),
        InnerTxnBuilder.Submit(),
        App.globalPut(status_key, status_refunded),
        Approve()
    ])

    # Get current status
    on_status = Seq([
        Log(Concat(
            Bytes("Status:"),
            App.globalGet(status_key)
        )),
        Approve()
    ])

    program = Cond(
        [Txn.application_id() == Int(0), on_creation],
        [Txn.application_args[0] == Bytes("fund"), on_fund],
        [Txn.application_args[0] == Bytes("confirm"), on_confirm],
        [Txn.application_args[0] == Bytes("refund"), on_refund],
        [Txn.application_args[0] == Bytes("status"), on_status],
    )

    return program

def clear_state_program():
    return Approve()

if __name__ == "__main__":
    print("Compiling Approval Program...")
    with open("escrow_approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), mode=Mode.Application, version=8)
        f.write(compiled)

    print("Compiling Clear State Program...")
    with open("escrow_clear.teal", "w") as f:
        compiled = compileTeal(clear_state_program(), mode=Mode.Application, version=8)
        f.write(compiled)

    print("Compilation complete!")
    print("\nTo deploy this contract:")
    print("1. goal app create --creator <CREATOR_ADDRESS> \\")
    print("   --approval-prog escrow_approval.teal \\")
    print("   --clear-prog escrow_clear.teal \\")
    print("   --global-byteslices 3 --global-ints 2 \\")
    print("   --local-byteslices 0 --local-ints 0 \\")
    print("   --app-arg addr:<BUYER_ADDRESS> \\")
    print("   --app-arg addr:<SELLER_ADDRESS> \\")
    print("   --app-arg int:<AMOUNT_MICROALGOS>")
