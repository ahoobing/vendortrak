import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useQuery } from 'react-query';
import { vendorAPI } from '../services/api';
import ForceGraph2D from 'react-force-graph-2d';
import { 
  Filter,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
  Edit3,
  Save,
  X,
  Move,
  Database,
  Building2
} from 'lucide-react';

const VendorGraph = () => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [nodePositions, setNodePositions] = useState({});
  const [filters, setFilters] = useState({
    showDataTypes: true,
    showIndustries: true,
    showRiskLevels: true,
    showContractValues: true
  });
  const [graphSettings, setGraphSettings] = useState({
    enableAnimation: true,
    linkDistance: 100,
    nodeStrength: -30,
    enableDrag: true
  });

  const graphRef = useRef();

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

    // Add vendor nodes as squares
    vendors.forEach((vendor, index) => {
      const vendorNode = {
        id: `vendor-${vendor._id}`,
        name: vendor.name,
        type: 'vendor',
        vendor: vendor,
        size: Math.max(30, Math.min(60, (vendor.contractValue || 0) / 10000)),
        color: getRiskColor(vendor.riskLevel),
        x: nodePositions[`vendor-${vendor._id}`]?.x || Math.cos(index * 2 * Math.PI / vendors.length) * 300,
        y: nodePositions[`vendor-${vendor._id}`]?.y || Math.sin(index * 2 * Math.PI / vendors.length) * 300,
        shape: 'square'
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
            size: 20,
            color: '#6366f1',
            x: nodePositions[industryId]?.x || Math.random() * 600 - 300,
            y: nodePositions[industryId]?.y || Math.random() * 600 - 300,
            shape: 'circle'
          };
          nodes.push(industryNode);
          nodeMap.set(industryId, industryNode);
        }
        links.push({
          source: vendorNode.id,
          target: industryId,
          type: 'industry',
          color: '#6366f1',
          label: 'Processes'
        });
      }

      // Add data types if available
      if (filters.showDataTypes && vendor.dataTypes && Array.isArray(vendor.dataTypes)) {
        vendor.dataTypes.forEach(dataType => {
          const dataTypeId = `datatype-${dataType.dataTypeId?._id || dataType}`;
          if (!nodeMap.has(dataTypeId)) {
            const dataTypeNode = {
              id: dataTypeId,
              name: dataType.dataTypeId?.name || dataType,
              type: 'datatype',
              size: 15,
              color: '#10b981',
              x: nodePositions[dataTypeId]?.x || Math.random() * 600 - 300,
              y: nodePositions[dataTypeId]?.y || Math.random() * 600 - 300,
              shape: 'diamond'
            };
            nodes.push(dataTypeNode);
            nodeMap.set(dataTypeId, dataTypeNode);
          }
          links.push({
            source: vendorNode.id,
            target: dataTypeId,
            type: 'datatype',
            color: '#10b981',
            label: 'Processes Data'
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
            size: 25,
            color: getRiskColor(vendor.riskLevel),
            x: nodePositions[riskId]?.x || Math.random() * 600 - 300,
            y: nodePositions[riskId]?.y || Math.random() * 600 - 300,
            shape: 'triangle'
          };
          nodes.push(riskNode);
          nodeMap.set(riskId, riskNode);
        }
        links.push({
          source: vendorNode.id,
          target: riskId,
          type: 'risk',
          color: getRiskColor(vendor.riskLevel),
          label: 'Risk Level'
        });
      }
    });

    return { nodes, links };
  }, [vendorsData, filters, nodePositions]);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
  }, []);

  const handleNodeDrag = useCallback((node, translate) => {
    if (editMode) {
      setNodePositions(prev => ({
        ...prev,
        [node.id]: {
          x: node.x + translate.x,
          y: node.y + translate.y
        }
      }));
    }
  }, [editMode]);

  const handleNodeDragEnd = useCallback((node) => {
    if (editMode) {
      setNodePositions(prev => ({
        ...prev,
        [node.id]: {
          x: node.x,
          y: node.y
        }
      }));
    }
  }, [editMode]);

  const handleZoomIn = useCallback(() => {
    if (graphRef.current && typeof graphRef.current.zoom === 'function') {
      try {
        const currentZoom = graphRef.current.zoom();
        if (currentZoom !== undefined && currentZoom !== null) {
          graphRef.current.zoom(currentZoom * 1.5, 1000);
        } else {
          graphRef.current.zoom(1.5, 1000);
        }
      } catch (error) {
        console.warn('Zoom in failed:', error);
      }
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (graphRef.current && typeof graphRef.current.zoom === 'function') {
      try {
        const currentZoom = graphRef.current.zoom();
        if (currentZoom !== undefined && currentZoom !== null) {
          graphRef.current.zoom(currentZoom * 0.75, 1000);
        } else {
          graphRef.current.zoom(0.75, 1000);
        }
      } catch (error) {
        console.warn('Zoom out failed:', error);
      }
    }
  }, []);

  const handleReset = useCallback(() => {
    setSelectedNode(null);
    setNodePositions({});
    if (graphRef.current && typeof graphRef.current.centerAt === 'function' && typeof graphRef.current.zoom === 'function') {
      try {
        graphRef.current.centerAt(0, 0, 1000);
        graphRef.current.zoom(1, 1000);
      } catch (error) {
        console.warn('Reset view failed:', error);
      }
    }
  }, []);

  const saveLayout = useCallback(() => {
    // Save the current layout to localStorage
    localStorage.setItem('vendorGraphLayout', JSON.stringify(nodePositions));
    setEditMode(false);
  }, [nodePositions]);

  const loadLayout = useCallback(() => {
    const savedLayout = localStorage.getItem('vendorGraphLayout');
    if (savedLayout) {
      setNodePositions(JSON.parse(savedLayout));
    }
  }, []);

  // Load saved layout on component mount
  React.useEffect(() => {
    loadLayout();
  }, [loadLayout]);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Data Flow Graph</h1>
            <p className="text-gray-600">
              Interactive visualization showing vendor relationships and data processing flows
            </p>
          </div>
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <button
                  onClick={saveLayout}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Layout
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Layout
              </button>
            )}
          </div>
        </div>
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
              <h4 className="text-sm font-semibold mb-2">Animation Settings</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={graphSettings.enableAnimation}
                    onChange={(e) => setGraphSettings(prev => ({ ...prev, enableAnimation: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Enable Animation</span>
                </label>
                
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">Link Distance: {graphSettings.linkDistance}</label>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={graphSettings.linkDistance}
                    onChange={(e) => setGraphSettings(prev => ({ ...prev, linkDistance: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">Node Strength: {graphSettings.nodeStrength}</label>
                  <input
                    type="range"
                    min="-100"
                    max="0"
                    value={graphSettings.nodeStrength}
                    onChange={(e) => setGraphSettings(prev => ({ ...prev, nodeStrength: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>
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
                <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                <span>Vendors (Squares)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></div>
                <span>Industries (Circles)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 transform rotate-45 mr-2" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
                <span>Data Types (Diamonds)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 transform rotate-45 mr-2" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
                <span>Risk Levels (Triangles)</span>
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center text-xs text-gray-500">
                  <Move className="h-3 w-3 mr-1" />
                  {editMode ? 'Drag nodes to reposition' : 'Click Edit Layout to move nodes'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Graph Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Vendor Data Flow Network</h3>
                <div className="text-sm text-gray-500">
                  {processedGraphData.nodes.length} nodes, {processedGraphData.links.length} data flows
                </div>
              </div>
            </div>
            
            <div className="relative h-96">
              <ForceGraph2D
                ref={graphRef}
                graphData={processedGraphData}
                nodeLabel={(node) => `${node.name} (${node.type})`}
                nodeColor={(node) => node.color}
                nodeRelSize={6}
                linkColor={(link) => link.color}
                linkWidth={2}
                linkDirectionalParticles={graphSettings.enableAnimation ? 2 : 0}
                linkDirectionalParticleSpeed={0.005}
                onNodeClick={handleNodeClick}
                onNodeDrag={handleNodeDrag}
                onNodeDragEnd={handleNodeDragEnd}
                cooldownTicks={graphSettings.enableAnimation ? 100 : 0}
                d3AlphaDecay={graphSettings.enableAnimation ? 0.02 : 0}
                d3VelocityDecay={graphSettings.enableAnimation ? 0.4 : 0}
                linkDistance={graphSettings.linkDistance}
                nodeStrength={graphSettings.nodeStrength}
                nodeCanvasObject={(node, ctx, globalScale) => {
                  const label = node.name;
                  const fontSize = 12/globalScale;
                  ctx.font = `${fontSize}px Sans-Serif`;
                  const textWidth = ctx.measureText(label).width;
                  const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

                  // Draw node shape based on type
                  ctx.fillStyle = node.color;
                  ctx.strokeStyle = editMode ? '#3b82f6' : '#374151';
                  ctx.lineWidth = editMode ? 2 : 1;

                  if (node.shape === 'square') {
                    const size = node.size / globalScale;
                    ctx.fillRect(node.x - size/2, node.y - size/2, size, size);
                    ctx.strokeRect(node.x - size/2, node.y - size/2, size, size);
                  } else if (node.shape === 'diamond') {
                    const size = node.size / globalScale;
                    ctx.beginPath();
                    ctx.moveTo(node.x, node.y - size/2);
                    ctx.lineTo(node.x + size/2, node.y);
                    ctx.lineTo(node.x, node.y + size/2);
                    ctx.lineTo(node.x - size/2, node.y);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                  } else if (node.shape === 'triangle') {
                    const size = node.size / globalScale;
                    ctx.beginPath();
                    ctx.moveTo(node.x, node.y - size/2);
                    ctx.lineTo(node.x - size/2, node.y + size/2);
                    ctx.lineTo(node.x + size/2, node.y + size/2);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                  } else {
                    // Circle (default)
                    const size = node.size / globalScale;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, size/2, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.stroke();
                  }

                  // Draw label background
                  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                  ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

                  // Draw label text
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = '#374151';
                  ctx.fillText(label, node.x, node.y);

                  node.__bckgDimensions = bckgDimensions;
                }}
                linkCanvasObject={(link, ctx, globalScale) => {
                  // Draw link label
                  if (link.label) {
                    const fontSize = 10/globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;
                    ctx.fillStyle = link.color;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    const midX = (link.source.x + link.target.x) / 2;
                    const midY = (link.source.y + link.target.y) / 2;
                    
                    // Background for text
                    const textWidth = ctx.measureText(link.label).width;
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.fillRect(midX - textWidth/2 - 2, midY - fontSize/2 - 1, textWidth + 4, fontSize + 2);
                    
                    // Text
                    ctx.fillStyle = link.color;
                    ctx.fillText(link.label, midX, midY);
                  }
                }}
              />
            </div>
          </div>

          {/* Node Details Panel */}
          {selectedNode && (
            <div className="mt-4 bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  {selectedNode.type === 'vendor' ? <Building2 className="h-5 w-5 mr-2" /> : 
                   selectedNode.type === 'datatype' ? <Database className="h-5 w-5 mr-2" /> :
                   <Info className="h-5 w-5 mr-2" />}
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
                            {type.dataTypeId?.name || type}
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
