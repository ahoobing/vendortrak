import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from 'react-query';
import { vendorAPI } from '../services/api';
import ForceGraph2D from 'react-force-graph-2d';
import { 
  Building2, 
  Database, 
  Network, 
  Filter,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info
} from 'lucide-react';

const VendorGraph = () => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [filters, setFilters] = useState({
    showDataTypes: true,
    showIndustries: true,
    showRiskLevels: true,
    showContractValues: true
  });

  // Fetch vendor data
  const { data: vendorsData, isLoading, error } = useQuery('vendors', () => 
    vendorAPI.getAll({ limit: 1000 })
  );

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  // Process data for graph visualization
  const processedGraphData = useMemo(() => {
    if (!vendorsData?.data?.vendors) return { nodes: [], links: [] };

    const vendors = vendorsData.data.vendors;
    const nodes = [];
    const links = [];
    const nodeMap = new Map();

    // Add vendor nodes
    vendors.forEach((vendor, index) => {
      const vendorNode = {
        id: `vendor-${vendor._id}`,
        name: vendor.name,
        type: 'vendor',
        vendor: vendor,
        size: Math.max(20, Math.min(50, (vendor.contractValue || 0) / 10000)),
        color: getRiskColor(vendor.riskLevel),
        x: Math.cos(index * 2 * Math.PI / vendors.length) * 200,
        y: Math.sin(index * 2 * Math.PI / vendors.length) * 200
      };
      nodes.push(vendorNode);
      nodeMap.set(vendorNode.id, vendorNode);

      // Add industry node if enabled
      if (filters.showIndustries && vendor.industry) {
        const industryId = `industry-${vendor.industry}`;
        if (!nodeMap.has(industryId)) {
          const industryNode = {
            id: industryId,
            name: vendor.industry,
            type: 'industry',
            size: 15,
            color: '#6366f1',
            x: Math.random() * 400 - 200,
            y: Math.random() * 400 - 200
          };
          nodes.push(industryNode);
          nodeMap.set(industryId, industryNode);
        }
        links.push({
          source: vendorNode.id,
          target: industryId,
          type: 'industry',
          color: '#6366f1'
        });
      }

      // Add data types if available
      if (filters.showDataTypes && vendor.dataTypes && Array.isArray(vendor.dataTypes)) {
        vendor.dataTypes.forEach(dataType => {
          const dataTypeId = `datatype-${dataType}`;
          if (!nodeMap.has(dataTypeId)) {
            const dataTypeNode = {
              id: dataTypeId,
              name: dataType,
              type: 'datatype',
              size: 12,
              color: '#10b981',
              x: Math.random() * 400 - 200,
              y: Math.random() * 400 - 200
            };
            nodes.push(dataTypeNode);
            nodeMap.set(dataTypeId, dataTypeNode);
          }
          links.push({
            source: vendorNode.id,
            target: dataTypeId,
            type: 'datatype',
            color: '#10b981'
          });
        });
      }

      // Add risk level nodes if enabled
      if (filters.showRiskLevels && vendor.riskLevel) {
        const riskId = `risk-${vendor.riskLevel}`;
        if (!nodeMap.has(riskId)) {
          const riskNode = {
            id: riskId,
            name: `${vendor.riskLevel.toUpperCase()} Risk`,
            type: 'risk',
            size: 18,
            color: getRiskColor(vendor.riskLevel),
            x: Math.random() * 400 - 200,
            y: Math.random() * 400 - 200
          };
          nodes.push(riskNode);
          nodeMap.set(riskId, riskNode);
        }
        links.push({
          source: vendorNode.id,
          target: riskId,
          type: 'risk',
          color: getRiskColor(vendor.riskLevel)
        });
      }
    });

    return { nodes, links };
  }, [vendorsData, filters]);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
  }, []);

  const handleNodeHover = useCallback((node) => {
    setHoveredNode(node);
  }, []);

  const handleZoomIn = useCallback(() => {
    // Implementation for zoom in
  }, []);

  const handleZoomOut = useCallback(() => {
    // Implementation for zoom out
  }, []);

  const handleReset = useCallback(() => {
    setSelectedNode(null);
    setHoveredNode(null);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold">Error loading vendor data</div>
          <div className="text-gray-600">Please try again later</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Relationship Graph</h1>
        <p className="text-gray-600">
          Interactive visualization showing vendor relationships, data processing, and industry connections
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Graph Controls
            </h3>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.showDataTypes}
                  onChange={(e) => setFilters(prev => ({ ...prev, showDataTypes: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm">Show Data Types</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.showIndustries}
                  onChange={(e) => setFilters(prev => ({ ...prev, showIndustries: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm">Show Industries</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.showRiskLevels}
                  onChange={(e) => setFilters(prev => ({ ...prev, showRiskLevels: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm">Show Risk Levels</span>
              </label>
            </div>

            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2">Graph Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={handleZoomIn}
                  className="flex items-center w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                >
                  <ZoomIn className="h-4 w-4 mr-2" />
                  Zoom In
                </button>
                <button
                  onClick={handleZoomOut}
                  className="flex items-center w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                >
                  <ZoomOut className="h-4 w-4 mr-2" />
                  Zoom Out
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset View
                </button>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-4">Legend</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span>Vendors</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></div>
                <span>Industries</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>Data Types</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span>High Risk</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span>Medium Risk</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
                <span>Low Risk</span>
              </div>
            </div>
          </div>
        </div>

        {/* Graph Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Vendor Network</h3>
                <div className="text-sm text-gray-500">
                  {processedGraphData.nodes.length} nodes, {processedGraphData.links.length} connections
                </div>
              </div>
            </div>
            
            <div className="relative h-96">
              <ForceGraph2D
                graphData={processedGraphData}
                nodeLabel={(node) => `${node.name} (${node.type})`}
                nodeColor={(node) => node.color}
                nodeRelSize={6}
                linkColor={(link) => link.color}
                linkWidth={2}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.005}
                onNodeClick={handleNodeClick}
                onNodeHover={handleNodeHover}
                cooldownTicks={100}
                nodeCanvasObject={(node, ctx, globalScale) => {
                  const label = node.name;
                  const fontSize = 12/globalScale;
                  ctx.font = `${fontSize}px Sans-Serif`;
                  const textWidth = ctx.measureText(label).width;
                  const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

                  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                  ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = node.color;
                  ctx.fillText(label, node.x, node.y);

                  node.__bckgDimensions = bckgDimensions;
                }}
              />
            </div>
          </div>

          {/* Node Details Panel */}
          {selectedNode && (
            <div className="mt-4 bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  {selectedNode.name}
                </h3>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              {selectedNode.type === 'vendor' && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Industry:</span> {selectedNode.vendor.industry || 'N/A'}
                  </div>
                  <div>
                    <span className="font-semibold">Risk Level:</span> 
                    <span className={`ml-1 px-2 py-1 rounded text-xs ${getRiskColor(selectedNode.vendor.riskLevel)}`}>
                      {selectedNode.vendor.riskLevel || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">Status:</span> {selectedNode.vendor.status || 'N/A'}
                  </div>
                  <div>
                    <span className="font-semibold">Contract Value:</span> ${selectedNode.vendor.contractValue?.toLocaleString() || 'N/A'}
                  </div>
                  {selectedNode.vendor.dataTypes && selectedNode.vendor.dataTypes.length > 0 && (
                    <div className="col-span-2">
                      <span className="font-semibold">Data Types:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {selectedNode.vendor.dataTypes.map((type, index) => (
                          <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {selectedNode.type === 'industry' && (
                <div className="text-sm">
                  <p><span className="font-semibold">Type:</span> Industry Category</p>
                  <p><span className="font-semibold">Connected Vendors:</span> {
                    processedGraphData.links.filter(link => 
                      link.target === selectedNode.id && link.type === 'industry'
                    ).length
                  }</p>
                </div>
              )}
              
              {selectedNode.type === 'datatype' && (
                <div className="text-sm">
                  <p><span className="font-semibold">Type:</span> Data Processing Category</p>
                  <p><span className="font-semibold">Connected Vendors:</span> {
                    processedGraphData.links.filter(link => 
                      link.target === selectedNode.id && link.type === 'datatype'
                    ).length
                  }</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorGraph;
