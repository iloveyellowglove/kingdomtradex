import type { ReferralTreeNode } from '@/lib/types';

export default function ReferralTreeView({ tree }: { tree: ReferralTreeNode[] }) {
  if (tree.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-8">
          <p className="text-text-muted mb-0">No disciples yet. Share your referral code to start building your network.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tree.map((node) => (
        <TreeNode key={node.id} node={node} />
      ))}
    </div>
  );
}

function TreeNode({ node }: { node: ReferralTreeNode }) {
  return (
    <div className="ml-4 pl-4 border-l-3 border-l-temple-gold">
      <div className="card mb-2 p-3 hover:shadow-gold-glow transition">
        <div className="flex justify-between items-center">
          <div>
            <strong className="text-text-primary">{node.username}</strong>
            <span className="text-text-muted text-sm ml-2">Level {node.level}</span>
          </div>
          <div className="text-right">
            <span className="text-temple-gold">{Number(node.display_balance).toFixed(6)} USDT</span>
            <br />
            <small className="text-text-muted">{new Date(node.created_at).toLocaleDateString()}</small>
          </div>
        </div>
      </div>
      {node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}
